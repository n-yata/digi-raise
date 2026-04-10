package battle

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/n-yata/digi-raise/backend/internal/apigw"
	"github.com/n-yata/digi-raise/backend/internal/db"
)


const (
	roomCodeLength   = 6
	maxCreateRetries = 5
	// roomCodeChars は紛らわしい文字 (I, O, 0, 1) を除外した文字セット
	roomCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

	// maxCreaturePayloadBytes はクリーチャーペイロードの最大サイズ
	maxCreaturePayloadBytes = 16384
)

// validCreatureData はクライアントから受信するクリーチャーデータの期待される形状を定義する
type validCreatureData struct {
	ID             string                     `json:"id"`
	Name           string                     `json:"name"`
	Type           string                     `json:"type"`
	HP             int                        `json:"hp"`
	MaxHP          int                        `json:"maxHp"`
	ATK            int                        `json:"atk"`
	DEF            int                        `json:"def"`
	SPD            int                        `json:"spd"`
	Level          int                        `json:"level"`
	EvolutionStage int                        `json:"evolutionStage"`
	EvolutionName  string                     `json:"evolutionName"`
	Wins           int                        `json:"wins"`
	Losses         int                        `json:"losses"`
	CustomSprites  map[string]string          `json:"customSprites,omitempty"`
}

var validTypes = map[string]bool{
	"Fire": true, "Water": true, "Plant": true,
	"Thunder": true, "Dark": true, "Light": true,
}

// validateCreaturePayload はクリーチャーペイロードのサイズ・構造・フィールド値を検証し、
// 不明なフィールドを除去した再マーシャル済みの JSON を返す
func validateCreaturePayload(raw json.RawMessage) (json.RawMessage, error) {
	if len(raw) == 0 {
		return nil, fmt.Errorf("creature data is empty")
	}
	if len(raw) > maxCreaturePayloadBytes {
		return nil, fmt.Errorf("creature payload too large: %d bytes", len(raw))
	}

	var c validCreatureData
	if err := json.Unmarshal(raw, &c); err != nil {
		return nil, fmt.Errorf("invalid creature JSON: %w", err)
	}

	if len(c.Name) == 0 || len(c.Name) > 50 {
		return nil, fmt.Errorf("invalid creature name length: %d", len(c.Name))
	}
	if !validTypes[c.Type] {
		return nil, fmt.Errorf("invalid creature type: %s", c.Type)
	}
	if c.HP < 0 || c.HP > 99999 || c.MaxHP < 1 || c.MaxHP > 99999 {
		return nil, fmt.Errorf("invalid HP values")
	}
	if c.ATK < 0 || c.ATK > 9999 || c.DEF < 0 || c.DEF > 9999 || c.SPD < 0 || c.SPD > 9999 {
		return nil, fmt.Errorf("invalid stat values")
	}
	if c.Level < 1 || c.Level > 999 {
		return nil, fmt.Errorf("invalid level: %d", c.Level)
	}
	if c.EvolutionStage < 0 || c.EvolutionStage > 5 {
		return nil, fmt.Errorf("invalid evolution stage: %d", c.EvolutionStage)
	}

	// 不明なフィールドを除去するために再マーシャル
	return json.Marshal(c)
}

// opponentJoinedEvent は opponent_joined イベントのペイロード
type opponentJoinedEvent struct {
	Event            string          `json:"event"`
	OpponentCreature json.RawMessage `json:"opponentCreature"`
}

// generateRoomCode は crypto/rand を使って安全なランダム6桁コードを生成する
func generateRoomCode() (string, error) {
	chars := []rune(roomCodeChars)
	n := big.NewInt(int64(len(chars)))

	var sb strings.Builder
	for i := 0; i < roomCodeLength; i++ {
		idx, err := rand.Int(rand.Reader, n)
		if err != nil {
			return "", fmt.Errorf("generate random index: %w", err)
		}
		sb.WriteRune(chars[idx.Int64()])
	}
	return sb.String(), nil
}

// CreateRoom はルームを作成し、ルームコードを返す
// 1. クリーチャーデータのバリデーション
// 2. ランダムな6桁英数字コードを生成
// 3. rooms テーブルで条件付き PutItem（重複チェック）
// 4. 重複していたら再生成（最大5回）
// 5. connections テーブルの roomCode を更新
func CreateRoom(ctx context.Context, rooms db.RoomStore, connections db.ConnectionStore, connID string, creature json.RawMessage) (string, error) {
	validated, err := validateCreaturePayload(creature)
	if err != nil {
		return "", fmt.Errorf("invalid creature data: %w", err)
	}

	for i := 0; i < maxCreateRetries; i++ {
		code, err := generateRoomCode()
		if err != nil {
			return "", fmt.Errorf("generate room code: %w", err)
		}

		err = rooms.CreateRoom(ctx, code, connID, validated)
		if err == db.ErrRoomAlreadyExists {
			log.Printf("room code %s already exists, retrying (%d/%d)", code, i+1, maxCreateRetries)
			continue
		}
		if err != nil {
			return "", fmt.Errorf("create room in DB: %w", err)
		}

		if err := connections.UpdateRoomCode(ctx, connID, code); err != nil {
			log.Printf("failed to update roomCode for connection %s: %v", connID, err)
		}

		log.Printf("room created: code=%s connID=%s", code, connID)
		return code, nil
	}
	return "", fmt.Errorf("failed to create room after %d retries", maxCreateRetries)
}

// JoinRoom はルームに参加し、双方にクリーチャー情報を通知する
// 1. クリーチャーデータのバリデーション
// 2. rooms テーブルで JoinRoom（条件付き UpdateItem）
// 3. connections テーブルの roomCode を更新
// 4. ホストに {"event":"opponent_joined","opponentCreature":guestCreature} を送信
// 5. ゲストに {"event":"opponent_joined","opponentCreature":hostCreature} を送信
func JoinRoom(ctx context.Context, rooms db.RoomStore, connections db.ConnectionStore, apigwClient apigw.MessageSender, connID string, roomCode string, creature json.RawMessage) error {
	validated, err := validateCreaturePayload(creature)
	if err != nil {
		return fmt.Errorf("invalid creature data: %w", err)
	}

	updatedRoom, err := rooms.JoinRoom(ctx, roomCode, connID, validated)
	if err != nil {
		return fmt.Errorf("join room: %w", err)
	}

	if err := connections.UpdateRoomCode(ctx, connID, roomCode); err != nil {
		log.Printf("failed to update roomCode for connection %s: %v", connID, err)
	}

	// ホストにゲストのクリーチャーを通知
	hostEvent := opponentJoinedEvent{
		Event:            "opponent_joined",
		OpponentCreature: validated,
	}
	if err := apigwClient.SendJSON(ctx, updatedRoom.HostConnectionID, hostEvent); err != nil {
		log.Printf("failed to notify host %s: %v", updatedRoom.HostConnectionID, err)
	}

	// ゲストにホストのクリーチャーを通知
	guestEvent := opponentJoinedEvent{
		Event:            "opponent_joined",
		OpponentCreature: updatedRoom.HostCreature,
	}
	if err := apigwClient.SendJSON(ctx, connID, guestEvent); err != nil {
		log.Printf("failed to notify guest %s: %v", connID, err)
	}

	log.Printf("room joined: code=%s host=%s guest=%s", roomCode, updatedRoom.HostConnectionID, connID)
	return nil
}

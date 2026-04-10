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
)

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
// 1. ランダムな6桁英数字コードを生成
// 2. rooms テーブルで条件付き PutItem（重複チェック）
// 3. 重複していたら再生成（最大5回）
// 4. connections テーブルの roomCode を更新
func CreateRoom(ctx context.Context, rooms db.RoomStore, connections db.ConnectionStore, connID string, creature json.RawMessage) (string, error) {
	for i := 0; i < maxCreateRetries; i++ {
		code, err := generateRoomCode()
		if err != nil {
			return "", fmt.Errorf("generate room code: %w", err)
		}

		err = rooms.CreateRoom(ctx, code, connID, creature)
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
// 1. rooms テーブルで JoinRoom（条件付き UpdateItem）
// 2. connections テーブルの roomCode を更新
// 3. ホストに {"event":"opponent_joined","opponentCreature":guestCreature} を送信
// 4. ゲストに {"event":"opponent_joined","opponentCreature":hostCreature} を送信
func JoinRoom(ctx context.Context, rooms db.RoomStore, connections db.ConnectionStore, apigwClient apigw.MessageSender, connID string, roomCode string, creature json.RawMessage) error {
	updatedRoom, err := rooms.JoinRoom(ctx, roomCode, connID, creature)
	if err != nil {
		return fmt.Errorf("join room: %w", err)
	}

	if err := connections.UpdateRoomCode(ctx, connID, roomCode); err != nil {
		log.Printf("failed to update roomCode for connection %s: %v", connID, err)
	}

	// ホストにゲストのクリーチャーを通知
	hostEvent := opponentJoinedEvent{
		Event:            "opponent_joined",
		OpponentCreature: creature,
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

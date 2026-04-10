package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/apigw"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

// DisconnectHandler は $disconnect ルートのリクエストを処理する
type DisconnectHandler struct {
	connections *db.ConnectionsTable
	rooms       *db.RoomsTable
	apigw       *apigw.Client
}

// NewDisconnectHandler は新しい DisconnectHandler を作成する
func NewDisconnectHandler(connections *db.ConnectionsTable, rooms *db.RoomsTable, apigwClient *apigw.Client) *DisconnectHandler {
	return &DisconnectHandler{
		connections: connections,
		rooms:       rooms,
		apigw:       apigwClient,
	}
}

// Handle は $disconnect ルートのリクエストを処理する
// 処理フロー:
// 1. connections テーブルから接続レコードを取得
// 2. roomCode が設定されていた場合:
//    a. rooms テーブルの該当ルームを取得
//    b. status が 'battling' の場合:
//       - 自分の role (host or guest) を特定
//       - reconnectToken を crypto/rand で生成（16バイト hex）
//       - rooms に disconnectedAt, disconnectedRole, reconnectToken を記録
//       - 相手プレイヤーへ {"event":"opponent_disconnected","timeoutSec":60} を送信
//    c. status が 'waiting' の場合:
//       - rooms レコードを削除
//    d. status が 'ready' の場合:
//       - 相手プレイヤーへ {"event":"opponent_disconnected","timeoutSec":60} を送信
//       - rooms レコードを削除
// 3. connections テーブルからレコードを削除
func (h *DisconnectHandler) Handle(ctx context.Context, req events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	connID := req.RequestContext.ConnectionID
	log.Printf("disconnect: connectionId=%s", connID)

	// 1. connections テーブルから接続レコードを取得
	conn, err := h.connections.Get(ctx, connID)
	if err != nil {
		log.Printf("disconnect: failed to get connection %s: %v", connID, err)
		// 接続レコードが見つからなくても正常終了（冪等性確保）
		return events.APIGatewayProxyResponse{StatusCode: 200}, nil
	}

	// 2. roomCode が設定されていた場合
	if conn.RoomCode != "" {
		if err := h.handleRoomDisconnect(ctx, connID, conn.RoomCode); err != nil {
			log.Printf("disconnect: room handling error connId=%s roomCode=%s: %v", connID, conn.RoomCode, err)
			// ルーム処理エラーは警告に留め、接続削除は続行する
		}
	}

	// 3. connections テーブルからレコードを削除
	if err := h.connections.Delete(ctx, connID); err != nil {
		log.Printf("disconnect: failed to delete connection %s: %v", connID, err)
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}

	log.Printf("disconnect: completed connectionId=%s", connID)
	return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

// handleRoomDisconnect はルームの切断処理を行う
func (h *DisconnectHandler) handleRoomDisconnect(ctx context.Context, connID, roomCode string) error {
	room, err := h.rooms.GetRoom(ctx, roomCode)
	if err != nil {
		return fmt.Errorf("get room %s: %w", roomCode, err)
	}
	if room == nil {
		log.Printf("disconnect: room not found roomCode=%s (already deleted)", roomCode)
		return nil
	}

	switch room.Status {
	case "battling":
		return h.handleBattlingDisconnect(ctx, connID, room)

	case "waiting":
		log.Printf("disconnect: deleting waiting room roomCode=%s", roomCode)
		if err := h.rooms.DeleteRoom(ctx, roomCode); err != nil {
			return fmt.Errorf("delete waiting room %s: %w", roomCode, err)
		}

	case "ready":
		log.Printf("disconnect: ready room disconnect roomCode=%s", roomCode)
		opponentConnID := h.getOpponentConnID(connID, room)
		if opponentConnID != "" {
			if err := h.apigw.SendJSON(ctx, opponentConnID, map[string]any{
				"event":      "opponent_disconnected",
				"timeoutSec": 60,
			}); err != nil {
				log.Printf("disconnect: failed to notify opponent %s: %v", opponentConnID, err)
			}
		}
		if err := h.rooms.DeleteRoom(ctx, roomCode); err != nil {
			return fmt.Errorf("delete ready room %s: %w", roomCode, err)
		}

	default:
		log.Printf("disconnect: no action for status=%s roomCode=%s", room.Status, roomCode)
	}

	return nil
}

// handleBattlingDisconnect はバトル中の切断処理を行う
func (h *DisconnectHandler) handleBattlingDisconnect(ctx context.Context, connID string, room *db.RoomRecord) error {
	// 自分の role を特定
	role := h.getRole(connID, room)
	if role == "" {
		log.Printf("disconnect: cannot determine role for connId=%s roomCode=%s", connID, room.RoomCode)
		return nil
	}

	// reconnectToken を生成（16バイト hex）
	tokenBytes := make([]byte, 16)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("generate reconnect token: %w", err)
	}
	reconnectToken := hex.EncodeToString(tokenBytes)

	// rooms に切断情報を記録
	if err := h.rooms.SetDisconnected(ctx, room.RoomCode, role, reconnectToken); err != nil {
		return fmt.Errorf("set disconnected roomCode=%s: %w", room.RoomCode, err)
	}
	log.Printf("disconnect: recorded disconnected role=%s roomCode=%s", role, room.RoomCode)

	// 相手プレイヤーへ通知
	opponentConnID := h.getOpponentConnID(connID, room)
	if opponentConnID != "" {
		if err := h.apigw.SendJSON(ctx, opponentConnID, map[string]any{
			"event":      "opponent_disconnected",
			"timeoutSec": 60,
		}); err != nil {
			log.Printf("disconnect: failed to notify opponent %s: %v", opponentConnID, err)
		}
	}

	return nil
}

// getRole は connID が host か guest かを返す。どちらでもなければ空文字を返す
func (h *DisconnectHandler) getRole(connID string, room *db.RoomRecord) string {
	if room.HostConnectionID == connID {
		return "host"
	}
	if room.GuestConnectionID == connID {
		return "guest"
	}
	return ""
}

// getOpponentConnID は自分の connID から相手の connectionID を返す
func (h *DisconnectHandler) getOpponentConnID(connID string, room *db.RoomRecord) string {
	if room.HostConnectionID == connID {
		return room.GuestConnectionID
	}
	if room.GuestConnectionID == connID {
		return room.HostConnectionID
	}
	return ""
}

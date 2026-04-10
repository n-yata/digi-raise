package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/apigw"
	"github.com/n-yata/digi-raise/backend/internal/battle"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

// MessageHandler は $default ルートの全メッセージを処理する
type MessageHandler struct {
	connections *db.ConnectionsTable
	rooms       *db.RoomsTable
	apigw       *apigw.Client
}

// NewMessageHandler は新しい MessageHandler を作成する
func NewMessageHandler(connections *db.ConnectionsTable, rooms *db.RoomsTable, apigwClient *apigw.Client) *MessageHandler {
	return &MessageHandler{
		connections: connections,
		rooms:       rooms,
		apigw:       apigwClient,
	}
}

// incomingMessage はクライアントから受信するメッセージの共通構造体
type incomingMessage struct {
	Action       string          `json:"action"`
	RoomCode     string          `json:"roomCode,omitempty"`
	Creature     json.RawMessage `json:"creature,omitempty"`
	BattleAction string          `json:"battleAction,omitempty"`
}

// Handle は $default ルートのリクエストを処理する
func (h *MessageHandler) Handle(ctx context.Context, req events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	connID := req.RequestContext.ConnectionID

	// 1. リクエストボディを JSON パース
	var msg incomingMessage
	if err := json.Unmarshal([]byte(req.Body), &msg); err != nil {
		log.Printf("message: failed to parse body connId=%s: %v", connID, err)
		if sendErr := h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_MESSAGE",
			"message": "invalid message format",
		}); sendErr != nil {
			log.Printf("message: failed to send error connId=%s: %v", connID, sendErr)
		}
		return events.APIGatewayProxyResponse{StatusCode: http.StatusBadRequest}, nil
	}

	// 2. レート制限チェック
	count, err := h.connections.IncrementMessageCount(ctx, connID)
	if err != nil {
		log.Printf("message: failed to increment message count connId=%s: %v", connID, err)
		return events.APIGatewayProxyResponse{}, err
	}
	if count > 60 {
		log.Printf("message: rate limited connId=%s count=%d", connID, count)
		if sendErr := h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "RATE_LIMITED",
			"message": "too many messages",
		}); sendErr != nil {
			log.Printf("message: failed to send rate limit error connId=%s: %v", connID, sendErr)
		}
		return events.APIGatewayProxyResponse{StatusCode: http.StatusTooManyRequests}, nil
	}

	// 3. action に応じてルーティング
	var routeErr error
	switch msg.Action {
	case "create_room":
		routeErr = h.handleCreateRoom(ctx, connID, msg)
	case "join_room":
		routeErr = h.handleJoinRoom(ctx, connID, msg)
	case "leave_room":
		routeErr = h.handleLeaveRoom(ctx, connID, msg)
	case "ready":
		routeErr = h.handleReady(ctx, connID, msg)
	case "select_action":
		routeErr = h.handleSelectAction(ctx, connID, msg)
	case "ping":
		routeErr = h.handlePing(ctx, connID)
	default:
		log.Printf("message: unknown action=%q connId=%s", msg.Action, connID)
		if sendErr := h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ACTION",
			"message": "unknown action",
		}); sendErr != nil {
			log.Printf("message: failed to send invalid action error connId=%s: %v", connID, sendErr)
		}
	}

	if routeErr != nil {
		log.Printf("message: handler error action=%q connId=%s: %v", msg.Action, connID, routeErr)
		return events.APIGatewayProxyResponse{}, routeErr
	}

	return events.APIGatewayProxyResponse{StatusCode: http.StatusOK}, nil
}

// handlePing は ping アクションを処理する
// connections テーブルの lastPingAt を更新し、messageCount をリセットし、pong を返す
func (h *MessageHandler) handlePing(ctx context.Context, connID string) error {
	if err := h.connections.ResetMessageCount(ctx, connID); err != nil {
		log.Printf("message: ping: failed to reset message count connId=%s: %v", connID, err)
		// カウントリセット失敗はクリティカルではないため続行
	}

	if err := h.apigw.SendJSON(ctx, connID, map[string]any{
		"event": "pong",
	}); err != nil {
		return err
	}

	log.Printf("message: ping: pong sent connId=%s", connID)
	return nil
}

// handleCreateRoom はルーム作成を処理する
func (h *MessageHandler) handleCreateRoom(ctx context.Context, connID string, msg incomingMessage) error {
	roomCode, err := battle.CreateRoom(ctx, h.rooms, h.connections, connID, msg.Creature)
	if err != nil {
		log.Printf("message: create_room: failed connId=%s: %v", connID, err)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "CREATE_ROOM_FAILED",
			"message": "room creation failed",
		})
	}

	log.Printf("message: create_room: created roomCode=%s connId=%s", roomCode, connID)
	return h.apigw.SendJSON(ctx, connID, map[string]any{
		"event":    "room_created",
		"roomCode": roomCode,
	})
}

// handleJoinRoom はルーム参加を処理する
func (h *MessageHandler) handleJoinRoom(ctx context.Context, connID string, msg incomingMessage) error {
	if !isValidRoomCode(msg.RoomCode) {
		log.Printf("message: join_room: invalid roomCode=%q connId=%s", msg.RoomCode, connID)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_CODE",
			"message": "invalid room code",
		})
	}

	if err := battle.JoinRoom(ctx, h.rooms, h.connections, h.apigw, connID, msg.RoomCode, msg.Creature); err != nil {
		log.Printf("message: join_room: failed connId=%s roomCode=%s: %v", connID, msg.RoomCode, err)
		code := "JOIN_ROOM_FAILED"
		if errors.Is(err, db.ErrRoomNotAvailable) {
			code = "ROOM_FULL"
		}
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    code,
			"message": "failed to join room",
		})
	}

	log.Printf("message: join_room: joined connId=%s roomCode=%s", connID, msg.RoomCode)
	return nil
}

// handleLeaveRoom はルーム退出を処理する（battle パッケージを使わず直接操作）
func (h *MessageHandler) handleLeaveRoom(ctx context.Context, connID string, msg incomingMessage) error {
	if !isValidRoomCode(msg.RoomCode) {
		log.Printf("message: leave_room: invalid roomCode=%q connId=%s", msg.RoomCode, connID)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_CODE",
			"message": "invalid room code",
		})
	}

	room, err := h.rooms.GetRoom(ctx, msg.RoomCode)
	if err != nil {
		log.Printf("message: leave_room: failed to get room connId=%s roomCode=%s: %v", connID, msg.RoomCode, err)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "ROOM_NOT_FOUND",
			"message": "room not found",
		})
	}
	if room == nil {
		log.Printf("message: leave_room: room not found connId=%s roomCode=%s", connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "ROOM_NOT_FOUND",
			"message": "room not found",
		})
	}

	switch room.Status {
	case "waiting":
		log.Printf("message: leave_room: deleting waiting room roomCode=%s", msg.RoomCode)
		if err := h.rooms.DeleteRoom(ctx, msg.RoomCode); err != nil {
			log.Printf("message: leave_room: failed to delete room roomCode=%s: %v", msg.RoomCode, err)
			return err
		}

	case "ready":
		log.Printf("message: leave_room: leaving ready room roomCode=%s", msg.RoomCode)
		opponentConnID := getOpponentConnID(connID, room)
		if opponentConnID != "" {
			if sendErr := h.apigw.SendJSON(ctx, opponentConnID, map[string]any{
				"event":   "opponent_left",
				"message": "opponent left the room",
			}); sendErr != nil {
				log.Printf("message: leave_room: failed to notify opponent connId=%s: %v", opponentConnID, sendErr)
			}
		}
		if err := h.rooms.DeleteRoom(ctx, msg.RoomCode); err != nil {
			log.Printf("message: leave_room: failed to delete room roomCode=%s: %v", msg.RoomCode, err)
			return err
		}

	default:
		log.Printf("message: leave_room: cannot leave room with status=%s roomCode=%s", room.Status, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "CANNOT_LEAVE",
			"message": "cannot leave room in current status",
		})
	}

	// connections テーブルの roomCode をクリア
	if err := h.connections.UpdateRoomCode(ctx, connID, ""); err != nil {
		log.Printf("message: leave_room: failed to clear roomCode connId=%s: %v", connID, err)
		// roomCode クリア失敗はクリティカルではないため続行
	}

	return h.apigw.SendJSON(ctx, connID, map[string]any{
		"event": "room_left",
	})
}

// handleReady は ready アクションのスタブ（Step 4 で実装）
func (h *MessageHandler) handleReady(ctx context.Context, connID string, msg incomingMessage) error {
	return h.apigw.SendJSON(ctx, connID, map[string]any{
		"event":   "error",
		"code":    "NOT_IMPLEMENTED",
		"message": "ready is not yet implemented",
	})
}

// handleSelectAction は select_action アクションのスタブ（Step 4 で実装）
func (h *MessageHandler) handleSelectAction(ctx context.Context, connID string, msg incomingMessage) error {
	return h.apigw.SendJSON(ctx, connID, map[string]any{
		"event":   "error",
		"code":    "NOT_IMPLEMENTED",
		"message": "select_action is not yet implemented",
	})
}

// isValidRoomCode はルームコードのフォーマットを検証する（6桁英数字）
func isValidRoomCode(code string) bool {
	if len(code) != 6 {
		return false
	}
	for _, c := range code {
		if !((c >= 'A' && c <= 'Z') || (c >= '2' && c <= '9')) {
			return false
		}
	}
	return true
}

// getOpponentConnID は connID から相手の connectionID を返す
func getOpponentConnID(connID string, room *db.RoomRecord) string {
	if room.HostConnectionID == connID {
		return room.GuestConnectionID
	}
	if room.GuestConnectionID == connID {
		return room.HostConnectionID
	}
	return ""
}

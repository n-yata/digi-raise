package handler

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"log"
	"math/big"
	"net/http"
	"time"

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
	// messageCount リセット
	if err := h.connections.ResetMessageCount(ctx, connID); err != nil {
		log.Printf("message: ping: failed to reset message count connId=%s: %v", connID, err)
		// カウントリセット失敗はクリティカルではないため続行
	}

	// 切断タイムアウト判定
	conn, err := h.connections.Get(ctx, connID)
	if err == nil && conn.RoomCode != "" {
		room, err := h.rooms.GetRoom(ctx, conn.RoomCode)
		if err == nil && room != nil && room.Status == "battling" && room.DisconnectedAt != nil {
			elapsed := time.Now().Unix() - *room.DisconnectedAt
			if elapsed > 60 {
				h.resolveDisconnectTimeout(ctx, room)
			}
		}
	}

	// pong 送信
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

// handleReady は ready アクションを処理する
func (h *MessageHandler) handleReady(ctx context.Context, connID string, msg incomingMessage) error {
	// 1. roomCode のバリデーション
	if !isValidRoomCode(msg.RoomCode) {
		log.Printf("message: ready: invalid roomCode=%q connId=%s", msg.RoomCode, connID)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_CODE",
			"message": "invalid room code",
		})
	}

	// 2. 現在のルームを取得
	room, err := h.rooms.GetRoom(ctx, msg.RoomCode)
	if err != nil {
		log.Printf("message: ready: failed to get room connId=%s roomCode=%s: %v", connID, msg.RoomCode, err)
		return err
	}
	if room == nil {
		log.Printf("message: ready: room not found connId=%s roomCode=%s", connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "ROOM_NOT_FOUND",
			"message": "room not found",
		})
	}

	// 3. status チェック（"ready" 状態のみ受け付ける）
	if room.Status != "ready" {
		log.Printf("message: ready: invalid room status=%s connId=%s roomCode=%s", room.Status, connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_STATUS",
			"message": "room is not in ready status",
		})
	}

	// 4. connID から自分の role を特定
	role := getRoleForConn(connID, room)
	if role == "" {
		log.Printf("message: ready: cannot determine role connId=%s roomCode=%s", connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "NOT_IN_ROOM",
			"message": "you are not a member of this room",
		})
	}

	// 5. ready フラグをセット（ALL_NEW で更新後のレコードを取得）
	updatedRoom, err := h.rooms.SetPlayerReady(ctx, msg.RoomCode, role)
	if err != nil {
		log.Printf("message: ready: failed to set ready role=%s connId=%s roomCode=%s: %v", role, connID, msg.RoomCode, err)
		return err
	}

	// 6. 両者 ready かどうか判定
	bothReady := updatedRoom.HostReady && updatedRoom.GuestReady
	log.Printf("message: ready: role=%s roomCode=%s bothReady=%v", role, msg.RoomCode, bothReady)

	// 7. 相手待ちの場合は何もしない
	if !bothReady {
		return nil
	}

	// 8. 両者 ready → バトル開始
	// a. ステータスを "battling" に変更
	if err := h.rooms.StartBattle(ctx, msg.RoomCode); err != nil {
		log.Printf("message: ready: failed to start battle roomCode=%s: %v", msg.RoomCode, err)
		return err
	}

	// b. seed を生成（JavaScript の安全な整数範囲内: 0 〜 2^53-1）
	seedBig, err := rand.Int(rand.Reader, big.NewInt(1<<53))
	if err != nil {
		log.Printf("message: ready: failed to generate seed roomCode=%s: %v", msg.RoomCode, err)
		return err
	}
	seed := seedBig.Int64()

	// c. ホストに battle_start を送信
	if sendErr := h.apigw.SendJSON(ctx, updatedRoom.HostConnectionID, map[string]any{
		"event":    "battle_start",
		"seed":     seed,
		"yourRole": "host",
	}); sendErr != nil {
		log.Printf("message: ready: failed to notify host roomCode=%s: %v", msg.RoomCode, sendErr)
	}

	// d. ゲストに battle_start を送信
	if sendErr := h.apigw.SendJSON(ctx, updatedRoom.GuestConnectionID, map[string]any{
		"event":    "battle_start",
		"seed":     seed,
		"yourRole": "guest",
	}); sendErr != nil {
		log.Printf("message: ready: failed to notify guest roomCode=%s: %v", msg.RoomCode, sendErr)
	}

	log.Printf("message: ready: battle started roomCode=%s seed=%d", msg.RoomCode, seed)
	return nil
}

// handleSelectAction は select_action アクションを処理する
func (h *MessageHandler) handleSelectAction(ctx context.Context, connID string, msg incomingMessage) error {
	// 1. roomCode バリデーション
	if !isValidRoomCode(msg.RoomCode) {
		log.Printf("message: select_action: invalid roomCode=%q connId=%s", msg.RoomCode, connID)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_CODE",
			"message": "invalid room code",
		})
	}

	// 2. battleAction バリデーション
	if !isValidBattleAction(msg.BattleAction) {
		log.Printf("message: select_action: invalid battleAction=%q connId=%s", msg.BattleAction, connID)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ACTION",
			"message": "invalid battle action",
		})
	}

	// 3. ルームを取得
	room, err := h.rooms.GetRoom(ctx, msg.RoomCode)
	if err != nil {
		log.Printf("message: select_action: failed to get room connId=%s roomCode=%s: %v", connID, msg.RoomCode, err)
		return err
	}

	// 4. ルームが存在しない or status != "battling" → エラー
	if room == nil {
		log.Printf("message: select_action: room not found connId=%s roomCode=%s", connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "ROOM_NOT_FOUND",
			"message": "room not found",
		})
	}
	if room.Status != "battling" {
		log.Printf("message: select_action: invalid room status=%s connId=%s roomCode=%s", room.Status, connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "INVALID_ROOM_STATUS",
			"message": "room is not in battling status",
		})
	}

	// 切断タイムアウト判定
	if room.DisconnectedAt != nil {
		elapsed := time.Now().Unix() - *room.DisconnectedAt
		if elapsed > 60 {
			h.resolveDisconnectTimeout(ctx, room)
			return h.apigw.SendJSON(ctx, connID, map[string]any{
				"event":  "battle_end",
				"winner": getOpponentRole(room.DisconnectedRole),
			})
		}
	}

	// 5. connID から role を特定
	role := getRoleForConn(connID, room)
	if role == "" {
		log.Printf("message: select_action: cannot determine role connId=%s roomCode=%s", connID, msg.RoomCode)
		return h.apigw.SendJSON(ctx, connID, map[string]any{
			"event":   "error",
			"code":    "NOT_IN_ROOM",
			"message": "you are not a member of this room",
		})
	}

	// 6. パッシブタイムアウトチェック（30秒超過で未選択側に guard を強制）
	room = h.checkActionTimeout(ctx, room)

	// 7. アクションをセット
	updatedRoom, err := h.rooms.SetAction(ctx, msg.RoomCode, role, msg.BattleAction)
	if err != nil {
		log.Printf("message: select_action: failed to set action role=%s connId=%s roomCode=%s: %v", role, connID, msg.RoomCode, err)
		return err
	}

	// 8. 両者のアクションが揃っているか判定
	bothReady := updatedRoom.HostAction != "" && updatedRoom.GuestAction != ""
	log.Printf("message: select_action: role=%s action=%s roomCode=%s bothReady=%v", role, msg.BattleAction, msg.RoomCode, bothReady)

	// 9. 相手待ちなら何もしない
	if !bothReady {
		return nil
	}

	// 10. 両者揃ったら actions_locked イベントを送信してターンを進める

	// a. crypto/rand で turnSeed を生成（JavaScript 安全整数範囲: 0 〜 2^53-1）
	seedBig, err := rand.Int(rand.Reader, big.NewInt(1<<53))
	if err != nil {
		log.Printf("message: select_action: failed to generate seed roomCode=%s: %v", msg.RoomCode, err)
		return err
	}
	seed := seedBig.Int64()

	payload := map[string]any{
		"event":       "actions_locked",
		"hostAction":  updatedRoom.HostAction,
		"guestAction": updatedRoom.GuestAction,
		"seed":        seed,
		"turnNumber":  updatedRoom.CurrentTurn,
	}

	// b. 両者に actions_locked を送信
	if sendErr := h.apigw.SendJSON(ctx, updatedRoom.HostConnectionID, payload); sendErr != nil {
		log.Printf("message: select_action: failed to notify host roomCode=%s: %v", msg.RoomCode, sendErr)
	}
	if sendErr := h.apigw.SendJSON(ctx, updatedRoom.GuestConnectionID, payload); sendErr != nil {
		log.Printf("message: select_action: failed to notify guest roomCode=%s: %v", msg.RoomCode, sendErr)
	}

	// c. ターンを進める
	if err := h.rooms.AdvanceTurn(ctx, msg.RoomCode); err != nil {
		log.Printf("message: select_action: failed to advance turn roomCode=%s: %v", msg.RoomCode, err)
		return err
	}

	log.Printf("message: select_action: turn advanced roomCode=%s turnNumber=%d seed=%d", msg.RoomCode, updatedRoom.CurrentTurn, seed)
	return nil
}

// checkActionTimeout はパッシブタイムアウトをチェックし、30秒超過時に未選択側に guard を強制する
func (h *MessageHandler) checkActionTimeout(ctx context.Context, room *db.RoomRecord) *db.RoomRecord {
	if room.TurnStartedAt == nil {
		return room
	}
	elapsed := time.Now().Unix() - *room.TurnStartedAt
	if elapsed <= 30 {
		return room // タイムアウトしていない
	}

	log.Printf("message: select_action: timeout detected elapsed=%ds roomCode=%s", elapsed, room.RoomCode)

	// 未選択側に guard を強制
	if room.HostAction == "" {
		if _, err := h.rooms.SetAction(ctx, room.RoomCode, "host", "guard"); err != nil {
			log.Printf("message: select_action: failed to force guard for host roomCode=%s: %v", room.RoomCode, err)
		} else {
			room.HostAction = "guard"
		}
	}
	if room.GuestAction == "" {
		if _, err := h.rooms.SetAction(ctx, room.RoomCode, "guest", "guard"); err != nil {
			log.Printf("message: select_action: failed to force guard for guest roomCode=%s: %v", room.RoomCode, err)
		} else {
			room.GuestAction = "guard"
		}
	}
	return room
}

// isValidBattleAction はバトルアクションのバリデーションを行う
func isValidBattleAction(action string) bool {
	return action == "attack" || action == "guard" || action == "special"
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

// getRoleForConn は connID が host か guest かを返す。どちらでもなければ空文字を返す
func getRoleForConn(connID string, room *db.RoomRecord) string {
	if room.HostConnectionID == connID {
		return "host"
	}
	if room.GuestConnectionID == connID {
		return "guest"
	}
	return ""
}

// getOpponentRole は切断した role の相手 role を返す
func getOpponentRole(role string) string {
	if role == "host" {
		return "guest"
	}
	return "host"
}

// getConnIDForRole は role に対応する connectionID を返す
func getConnIDForRole(role string, room *db.RoomRecord) string {
	if role == "host" {
		return room.HostConnectionID
	}
	return room.GuestConnectionID
}

// resolveDisconnectTimeout は切断タイムアウトを処理しバトルを終了する
func (h *MessageHandler) resolveDisconnectTimeout(ctx context.Context, room *db.RoomRecord) {
	winner := getOpponentRole(room.DisconnectedRole)

	if err := h.rooms.SetFinished(ctx, room.RoomCode, winner); err != nil {
		log.Printf("message: disconnect timeout: failed to set finished roomCode=%s: %v", room.RoomCode, err)
		return
	}

	// 残存プレイヤーに battle_end を通知
	winnerConnID := getConnIDForRole(winner, room)
	if winnerConnID != "" {
		h.apigw.SendJSON(ctx, winnerConnID, map[string]any{
			"event":  "battle_end",
			"winner": winner,
		})
	}

	log.Printf("message: disconnect timeout: battle ended roomCode=%s winner=%s", room.RoomCode, winner)
}

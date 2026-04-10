package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/apigw"
	"github.com/n-yata/digi-raise/backend/internal/auth"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

// ConnectHandler は $connect ルートのリクエストを処理する
type ConnectHandler struct {
	connections db.ConnectionStore
	config      db.ConfigStore
	auth        *auth.Verifier
	rooms       db.RoomStore
	apigw       apigw.MessageSender
}

// NewConnectHandler は新しい ConnectHandler を作成する
func NewConnectHandler(connections db.ConnectionStore, config db.ConfigStore, auth *auth.Verifier, rooms db.RoomStore, apigwClient apigw.MessageSender) *ConnectHandler {
	return &ConnectHandler{
		connections: connections,
		config:      config,
		auth:        auth,
		rooms:       rooms,
		apigw:       apigwClient,
	}
}

// Handle は $connect ルートのリクエストを処理する
// 処理フロー:
// 1. メンテナンスモードチェック → 503
// 2. クエリパラメータ "token" を HMAC 検証 → 401
// 3. connections テーブルに新規レコード作成
// 4. reconnectToken チェック（クエリパラメータ reconnectToken + roomCode が両方ある場合）:
//   - VerifyReconnectToken で検証
//   - 成功 → ClearDisconnected + 接続レコードに roomCode を紐付け + 相手に reconnected イベント送信
//   - 失敗 → ログに警告を出すだけ（通常接続として扱う）
//
// 5. 200 を返す
func (h *ConnectHandler) Handle(ctx context.Context, req events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	connID := req.RequestContext.ConnectionID

	// 1. メンテナンスモードチェック
	maintenance, err := h.config.IsMaintenanceMode(ctx)
	if err != nil {
		// インフラ起因エラー → Lambda にリトライさせる
		log.Printf("failed to check maintenance mode: %v", err)
		return events.APIGatewayProxyResponse{}, err
	}
	if maintenance {
		log.Printf("connection rejected: maintenance mode, connectionId=%s", connID)
		return events.APIGatewayProxyResponse{StatusCode: http.StatusServiceUnavailable}, nil
	}

	// 2. トークン検証
	token := req.QueryStringParameters["token"]
	if err := h.auth.Verify(token); err != nil {
		log.Printf("auth failed: %v, connectionId=%s", err, connID)
		return events.APIGatewayProxyResponse{StatusCode: http.StatusUnauthorized}, nil
	}

	// 3. 接続レコード作成
	if err := h.connections.Create(ctx, connID); err != nil {
		// インフラ起因エラー → Lambda にリトライさせる
		log.Printf("failed to create connection record: %v, connectionId=%s", err, connID)
		return events.APIGatewayProxyResponse{}, err
	}

	log.Printf("connected: connectionId=%s", connID)

	// 4. 再接続トークンチェック
	reconnectToken := req.QueryStringParameters["reconnectToken"]
	roomCode := req.QueryStringParameters["roomCode"]
	if reconnectToken != "" && roomCode != "" {
		if err := h.handleReconnect(ctx, connID, roomCode, reconnectToken); err != nil {
			// 再接続処理が失敗しても接続自体は拒否しない（通常接続として扱う）
			log.Printf("reconnect failed (treating as normal connect): %v, connectionId=%s", err, connID)
		}
	}

	return events.APIGatewayProxyResponse{StatusCode: http.StatusOK}, nil
}

// handleReconnect は再接続処理を行う
// 失敗時は error を返す（呼び出し元は通常接続として扱う）
func (h *ConnectHandler) handleReconnect(ctx context.Context, newConnID, roomCode, reconnectToken string) error {
	// reconnectToken + roomCode でルーム検証
	room, err := h.rooms.VerifyReconnectToken(ctx, roomCode, reconnectToken)
	if err != nil {
		return err
	}

	role := room.DisconnectedRole

	// 切断情報をクリアし、新しい connectionID を設定
	if err := h.rooms.ClearDisconnected(ctx, roomCode, role, newConnID, reconnectToken); err != nil {
		return err
	}

	// 接続レコードに roomCode を紐付け
	if err := h.connections.UpdateRoomCode(ctx, newConnID, roomCode); err != nil {
		return err
	}

	log.Printf("reconnect succeeded: roomCode=%s, role=%s, newConnID=%s", roomCode, role, newConnID)

	// 相手の connectionID を特定
	var opponentConnID string
	switch role {
	case "host":
		opponentConnID = room.GuestConnectionID
	case "guest":
		opponentConnID = room.HostConnectionID
	}

	// 相手に reconnected イベントを送信
	if opponentConnID != "" {
		payload := map[string]string{
			"event": "reconnected",
			"role":  role,
		}
		if err := h.apigw.SendJSON(ctx, opponentConnID, payload); err != nil {
			// 相手への通知失敗はログに残すが、再接続自体は成功扱い
			log.Printf("failed to notify opponent of reconnect: %v, opponentConnID=%s", err, opponentConnID)
		}
	}

	return nil
}

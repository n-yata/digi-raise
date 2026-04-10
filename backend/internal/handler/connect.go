package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/auth"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

// ConnectHandler は $connect ルートのリクエストを処理する
type ConnectHandler struct {
	connections *db.ConnectionsTable
	config      *db.ConfigTable
	auth        *auth.Verifier
}

// NewConnectHandler は新しい ConnectHandler を作成する
func NewConnectHandler(connections *db.ConnectionsTable, config *db.ConfigTable, auth *auth.Verifier) *ConnectHandler {
	return &ConnectHandler{
		connections: connections,
		config:      config,
		auth:        auth,
	}
}

// Handle は $connect ルートのリクエストを処理する
// 処理フロー:
// 1. メンテナンスモードチェック → 503
// 2. クエリパラメータ "token" を HMAC 検証 → 401
// 3. connections テーブルに新規レコード作成
// 4. 200 を返す
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
	return events.APIGatewayProxyResponse{StatusCode: http.StatusOK}, nil
}

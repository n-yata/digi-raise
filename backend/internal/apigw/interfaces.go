package apigw

import "context"

// MessageSender はWebSocket接続へのメッセージ送信を抽象化するインターフェース
type MessageSender interface {
	SendJSON(ctx context.Context, connectionID string, payload any) error
}

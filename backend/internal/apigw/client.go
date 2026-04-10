package apigw

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi"
	"github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi/types"
)

// Client は API Gateway Management API のラッパー
type Client struct {
	inner *apigatewaymanagementapi.Client
}

// NewClient はエンドポイントURLを指定してクライアントを作成する
// endpointURL: "https://{apiId}.execute-api.{region}.amazonaws.com/{stage}"
func NewClient(cfg aws.Config, endpointURL string) *Client {
	inner := apigatewaymanagementapi.NewFromConfig(cfg, func(o *apigatewaymanagementapi.Options) {
		o.BaseEndpoint = aws.String(endpointURL)
	})
	return &Client{inner: inner}
}

// SendJSON は任意の構造体を JSON にしてクライアントへ送信する
// 相手の接続が既に切れていた場合（GoneException）は error を返さず nil を返す
func (c *Client) SendJSON(ctx context.Context, connectionID string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	_, err = c.inner.PostToConnection(ctx, &apigatewaymanagementapi.PostToConnectionInput{
		ConnectionId: aws.String(connectionID),
		Data:         data,
	})
	if err != nil {
		if IsGoneError(err) {
			return nil
		}
		return fmt.Errorf("post to connection %s: %w", connectionID, err)
	}
	return nil
}

// IsGoneError は GoneException かどうかを判定する
func IsGoneError(err error) bool {
	var gone *types.GoneException
	return errors.As(err, &gone)
}

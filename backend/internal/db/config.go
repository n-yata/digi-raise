package db

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// ConfigTable は Config DynamoDB テーブルの操作を提供する
type ConfigTable struct {
	client    *dynamodb.Client
	tableName string
}

// NewConfigTable は新しい ConfigTable を作成する
func NewConfigTable(client *dynamodb.Client, tableName string) *ConfigTable {
	return &ConfigTable{
		client:    client,
		tableName: tableName,
	}
}

// IsMaintenanceMode は maintenance_mode フラグを確認する
// レコードが存在しない場合は false を返す
func (t *ConfigTable) IsMaintenanceMode(ctx context.Context) (bool, error) {
	out, err := t.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"configKey": &types.AttributeValueMemberS{Value: "maintenance_mode"},
		},
	})
	if err != nil {
		return false, fmt.Errorf("get config maintenance_mode: %w", err)
	}

	if out.Item == nil {
		return false, nil
	}

	val, ok := out.Item["value"]
	if !ok {
		return false, nil
	}

	// String 型 ("true"/"false") で格納される想定（CLI復旧コマンドと一致）
	strVal, ok := val.(*types.AttributeValueMemberS)
	if !ok {
		return false, nil
	}

	return strVal.Value == "true", nil
}

// SetMaintenanceMode は maintenance_mode フラグを設定する
func (t *ConfigTable) SetMaintenanceMode(ctx context.Context, enabled bool) error {
	value := "false"
	if enabled {
		value = "true"
	}
	_, err := t.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(t.tableName),
		Item: map[string]types.AttributeValue{
			"configKey": &types.AttributeValueMemberS{Value: "maintenance_mode"},
			"value":     &types.AttributeValueMemberS{Value: value},
		},
	})
	if err != nil {
		return fmt.Errorf("set maintenance_mode: %w", err)
	}
	return nil
}

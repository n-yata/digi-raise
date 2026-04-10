package db

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// connectionTTLSeconds は接続レコードの TTL（秒）
const connectionTTLSeconds = 3600

// ConnectionRecord は Connections テーブルの1レコードを表す
type ConnectionRecord struct {
	ConnectionID string `dynamodbav:"connectionId"`
	RoomCode     string `dynamodbav:"roomCode,omitempty"`
	ConnectedAt  int64  `dynamodbav:"connectedAt"`
	LastPingAt   int64  `dynamodbav:"lastPingAt"`
	MessageCount int    `dynamodbav:"messageCount"`
	TTL          int64  `dynamodbav:"ttl"`
}

// ConnectionsTable は Connections DynamoDB テーブルの操作を提供する
type ConnectionsTable struct {
	client    *dynamodb.Client
	tableName string
}

// NewConnectionsTable は新しい ConnectionsTable を作成する
func NewConnectionsTable(client *dynamodb.Client, tableName string) *ConnectionsTable {
	return &ConnectionsTable{
		client:    client,
		tableName: tableName,
	}
}

// Create は新しい接続レコードを作成する（TTL = connectedAt + 3600秒）
func (t *ConnectionsTable) Create(ctx context.Context, connID string) error {
	now := time.Now().Unix()
	record := ConnectionRecord{
		ConnectionID: connID,
		ConnectedAt:  now,
		LastPingAt:   now,
		MessageCount: 0,
		TTL:          now + connectionTTLSeconds,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("marshal connection record: %w", err)
	}

	_, err = t.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(t.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("put connection record: %w", err)
	}

	return nil
}

// Get は接続レコードを取得する
func (t *ConnectionsTable) Get(ctx context.Context, connID string) (*ConnectionRecord, error) {
	out, err := t.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"connectionId": &types.AttributeValueMemberS{Value: connID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get connection record: %w", err)
	}

	if out.Item == nil {
		return nil, fmt.Errorf("connection not found: %s", connID)
	}

	var record ConnectionRecord
	if err := attributevalue.UnmarshalMap(out.Item, &record); err != nil {
		return nil, fmt.Errorf("unmarshal connection record: %w", err)
	}

	return &record, nil
}

// Delete は接続レコードを削除する
func (t *ConnectionsTable) Delete(ctx context.Context, connID string) error {
	_, err := t.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"connectionId": &types.AttributeValueMemberS{Value: connID},
		},
	})
	if err != nil {
		return fmt.Errorf("delete connection record: %w", err)
	}

	return nil
}

// UpdateRoomCode は接続レコードの roomCode を更新する
func (t *ConnectionsTable) UpdateRoomCode(ctx context.Context, connID, roomCode string) error {
	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"connectionId": &types.AttributeValueMemberS{Value: connID},
		},
		UpdateExpression: aws.String("SET roomCode = :roomCode"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
	})
	if err != nil {
		return fmt.Errorf("update roomCode: %w", err)
	}

	return nil
}

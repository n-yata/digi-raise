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

// RoomRecord は Rooms テーブルの1レコードを表す
type RoomRecord struct {
	RoomCode          string `dynamodbav:"roomCode"`
	Status            string `dynamodbav:"status"` // waiting | ready | battling | finished
	HostConnectionID  string `dynamodbav:"hostConnectionId"`
	GuestConnectionID string `dynamodbav:"guestConnectionId,omitempty"`
	DisconnectedAt    *int64 `dynamodbav:"disconnectedAt,omitempty"`
	DisconnectedRole  string `dynamodbav:"disconnectedRole,omitempty"`
	ReconnectToken    string `dynamodbav:"reconnectToken,omitempty"`
	CurrentTurn       int    `dynamodbav:"currentTurn"`
	TurnPhase         string `dynamodbav:"turnPhase,omitempty"`
	TurnStartedAt     *int64 `dynamodbav:"turnStartedAt,omitempty"`
	Winner            string `dynamodbav:"winner,omitempty"`
	CreatedAt         int64  `dynamodbav:"createdAt"`
	TTL               int64  `dynamodbav:"ttl"`
}

// RoomsTable は Rooms DynamoDB テーブルの操作を提供する
type RoomsTable struct {
	client    *dynamodb.Client
	tableName string
}

// NewRoomsTable は新しい RoomsTable を作成する
func NewRoomsTable(client *dynamodb.Client, tableName string) *RoomsTable {
	return &RoomsTable{
		client:    client,
		tableName: tableName,
	}
}

// GetRoom はルームレコードを取得する
func (t *RoomsTable) GetRoom(ctx context.Context, roomCode string) (*RoomRecord, error) {
	out, err := t.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get room record: %w", err)
	}
	if out.Item == nil {
		return nil, nil
	}

	var record RoomRecord
	if err := attributevalue.UnmarshalMap(out.Item, &record); err != nil {
		return nil, fmt.Errorf("unmarshal room record: %w", err)
	}
	return &record, nil
}

// DeleteRoom はルームレコードを削除する
func (t *RoomsTable) DeleteRoom(ctx context.Context, roomCode string) error {
	_, err := t.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
	})
	if err != nil {
		return fmt.Errorf("delete room record: %w", err)
	}
	return nil
}

// SetDisconnected は切断情報を記録する（再接続猶予用）
// disconnectedAt = now, disconnectedRole = role, reconnectToken = 生成したトークン
func (t *RoomsTable) SetDisconnected(ctx context.Context, roomCode, role, reconnectToken string) error {
	now := time.Now().Unix()
	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		UpdateExpression: aws.String("SET disconnectedAt = :disconnectedAt, disconnectedRole = :disconnectedRole, reconnectToken = :reconnectToken"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":disconnectedAt":   &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", now)},
			":disconnectedRole": &types.AttributeValueMemberS{Value: role},
			":reconnectToken":   &types.AttributeValueMemberS{Value: reconnectToken},
		},
	})
	if err != nil {
		return fmt.Errorf("set disconnected: %w", err)
	}
	return nil
}

// SetFinished はバトルを終了させる（winner を設定、status = "finished"）
func (t *RoomsTable) SetFinished(ctx context.Context, roomCode, winner string) error {
	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		UpdateExpression: aws.String("SET #s = :status, winner = :winner"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":status": &types.AttributeValueMemberS{Value: "finished"},
			":winner": &types.AttributeValueMemberS{Value: winner},
		},
	})
	if err != nil {
		return fmt.Errorf("set finished: %w", err)
	}
	return nil
}

package db

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var (
	ErrRoomAlreadyExists = errors.New("room already exists")
	ErrRoomNotAvailable  = errors.New("room not available for joining")
)

// roomTTLSeconds はルームレコードの TTL（秒）
const roomTTLSeconds = 7200

// RoomRecord は Rooms テーブルの1レコードを表す
type RoomRecord struct {
	RoomCode          string          `dynamodbav:"roomCode"`
	Status            string          `dynamodbav:"status"` // waiting | ready | battling | finished
	HostConnectionID  string          `dynamodbav:"hostConnectionId"`
	GuestConnectionID string          `dynamodbav:"guestConnectionId,omitempty"`
	HostCreature      json.RawMessage `dynamodbav:"hostCreature,omitempty"`
	GuestCreature     json.RawMessage `dynamodbav:"guestCreature,omitempty"`
	DisconnectedAt    *int64          `dynamodbav:"disconnectedAt,omitempty"`
	DisconnectedRole  string          `dynamodbav:"disconnectedRole,omitempty"`
	ReconnectToken    string          `dynamodbav:"reconnectToken,omitempty"`
	CurrentTurn       int             `dynamodbav:"currentTurn"`
	TurnPhase         string          `dynamodbav:"turnPhase,omitempty"`
	TurnStartedAt     *int64          `dynamodbav:"turnStartedAt,omitempty"`
	Winner            string          `dynamodbav:"winner,omitempty"`
	CreatedAt         int64           `dynamodbav:"createdAt"`
	TTL               int64           `dynamodbav:"ttl"`
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

// CreateRoom は新しいルームを作成する（条件付き PutItem: 同じ roomCode が存在しない場合のみ）
// 成功時 nil, 重複時 ErrRoomAlreadyExists を返す
// TTL = createdAt + 7200秒
func (t *RoomsTable) CreateRoom(ctx context.Context, roomCode, hostConnID string, hostCreature json.RawMessage) error {
	now := time.Now().Unix()
	record := RoomRecord{
		RoomCode:         roomCode,
		Status:           "waiting",
		HostConnectionID: hostConnID,
		HostCreature:     hostCreature,
		CreatedAt:        now,
		TTL:              now + roomTTLSeconds,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("marshal room record: %w", err)
	}

	_, err = t.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(t.tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(roomCode)"),
	})
	if err != nil {
		var condErr *types.ConditionalCheckFailedException
		if errors.As(err, &condErr) {
			return ErrRoomAlreadyExists
		}
		return fmt.Errorf("create room: %w", err)
	}
	return nil
}

// JoinRoom はゲストとしてルームに参加する
// 条件: status == "waiting" かつ guestConnectionId が未設定
// 成功時は status を "ready" に更新し、guestConnectionId と guestCreature を設定
// 条件不一致時は ErrRoomNotAvailable を返す
func (t *RoomsTable) JoinRoom(ctx context.Context, roomCode, guestConnID string, guestCreature json.RawMessage) (*RoomRecord, error) {
	guestCreatureAttr, err := attributevalue.Marshal(guestCreature)
	if err != nil {
		return nil, fmt.Errorf("marshal guestCreature: %w", err)
	}

	out, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		ConditionExpression: aws.String("#s = :waiting AND attribute_not_exists(guestConnectionId)"),
		UpdateExpression:    aws.String("SET guestConnectionId = :guestConnID, guestCreature = :guestCreature, #s = :ready"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":waiting":       &types.AttributeValueMemberS{Value: "waiting"},
			":ready":         &types.AttributeValueMemberS{Value: "ready"},
			":guestConnID":   &types.AttributeValueMemberS{Value: guestConnID},
			":guestCreature": guestCreatureAttr,
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		var condErr *types.ConditionalCheckFailedException
		if errors.As(err, &condErr) {
			return nil, ErrRoomNotAvailable
		}
		return nil, fmt.Errorf("join room: %w", err)
	}

	var record RoomRecord
	if err := attributevalue.UnmarshalMap(out.Attributes, &record); err != nil {
		return nil, fmt.Errorf("unmarshal updated room record: %w", err)
	}
	return &record, nil
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

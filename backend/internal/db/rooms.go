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
	HostReady         bool            `dynamodbav:"hostReady"`
	GuestReady        bool            `dynamodbav:"guestReady"`
	HostAction        string          `dynamodbav:"hostAction,omitempty"`
	GuestAction       string          `dynamodbav:"guestAction,omitempty"`
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

// SetPlayerReady はプレイヤーの ready フラグをセットし、更新後のルームレコードを返す
// role は "host" または "guest"
// ReturnValues: ALL_NEW で更新後のレコードを取得し、両者 ready かを呼び出し元で判定できるようにする
func (t *RoomsTable) SetPlayerReady(ctx context.Context, roomCode, role string) (*RoomRecord, error) {
	var updateExpr string
	switch role {
	case "host":
		updateExpr = "SET hostReady = :true"
	case "guest":
		updateExpr = "SET guestReady = :true"
	default:
		return nil, fmt.Errorf("invalid role: %s", role)
	}

	out, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		UpdateExpression: aws.String(updateExpr),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":true": &types.AttributeValueMemberBOOL{Value: true},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("set player ready (role=%s): %w", role, err)
	}

	var record RoomRecord
	if err := attributevalue.UnmarshalMap(out.Attributes, &record); err != nil {
		return nil, fmt.Errorf("unmarshal updated room record: %w", err)
	}
	return &record, nil
}

// StartBattle はルームのステータスを "battling" に変更し、バトル初期状態をセットする
// ConditionExpression: status = "ready"（二重開始防止）
func (t *RoomsTable) StartBattle(ctx context.Context, roomCode string) error {
	now := time.Now().Unix()
	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		ConditionExpression: aws.String("#s = :ready"),
		UpdateExpression:    aws.String("SET #s = :battling, currentTurn = :one, turnPhase = :select, turnStartedAt = :now"),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":ready":    &types.AttributeValueMemberS{Value: "ready"},
			":battling": &types.AttributeValueMemberS{Value: "battling"},
			":one":      &types.AttributeValueMemberN{Value: "1"},
			":select":   &types.AttributeValueMemberS{Value: "select"},
			":now":      &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", now)},
		},
	})
	if err != nil {
		var condErr *types.ConditionalCheckFailedException
		if errors.As(err, &condErr) {
			// 既に battling に移行済み（二重開始）は正常扱い
			return nil
		}
		return fmt.Errorf("start battle: %w", err)
	}
	return nil
}

// SetAction はプレイヤーのアクションをセットし、更新後のルームレコードを返す
// role = "host" → SET hostAction = action
// role = "guest" → SET guestAction = action
// ConditionExpression: status = "battling"（バトル中でなければ拒否）
// ReturnValues: ALL_NEW
func (t *RoomsTable) SetAction(ctx context.Context, roomCode, role, action string) (*RoomRecord, error) {
	var updateExpr string
	var condExpr string
	switch role {
	case "host":
		updateExpr = "SET hostAction = :action"
		condExpr = "#s = :battling AND attribute_not_exists(hostAction)"
	case "guest":
		updateExpr = "SET guestAction = :action"
		condExpr = "#s = :battling AND attribute_not_exists(guestAction)"
	default:
		return nil, fmt.Errorf("invalid role: %s", role)
	}

	out, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		ConditionExpression: aws.String(condExpr),
		UpdateExpression:    aws.String(updateExpr),
		ExpressionAttributeNames: map[string]string{
			"#s": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":battling": &types.AttributeValueMemberS{Value: "battling"},
			":action":   &types.AttributeValueMemberS{Value: action},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		var condErr *types.ConditionalCheckFailedException
		if errors.As(err, &condErr) {
			return nil, fmt.Errorf("room is not in battling status")
		}
		return nil, fmt.Errorf("set action (role=%s): %w", role, err)
	}

	var record RoomRecord
	if err := attributevalue.UnmarshalMap(out.Attributes, &record); err != nil {
		return nil, fmt.Errorf("unmarshal updated room record: %w", err)
	}
	return &record, nil
}

// AdvanceTurn はターンを進める
// currentTurn を +1、hostAction と guestAction を削除、turnPhase = "select"、turnStartedAt = now
func (t *RoomsTable) AdvanceTurn(ctx context.Context, roomCode string) error {
	now := time.Now().Unix()
	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		UpdateExpression: aws.String("SET currentTurn = currentTurn + :one, turnPhase = :select, turnStartedAt = :now REMOVE hostAction, guestAction"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":one":    &types.AttributeValueMemberN{Value: "1"},
			":select": &types.AttributeValueMemberS{Value: "select"},
			":now":    &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", now)},
		},
	})
	if err != nil {
		return fmt.Errorf("advance turn: %w", err)
	}
	return nil
}

// VerifyReconnectToken は roomCode と reconnectToken の組み合わせを検証し、ルームレコードを返す
// - ルームが存在しない → error
// - room.ReconnectToken != token → error
// - room.DisconnectedAt == nil → error（切断されていない）
// - 検証成功 → ルームレコードを返す
func (t *RoomsTable) VerifyReconnectToken(ctx context.Context, roomCode, token string) (*RoomRecord, error) {
	room, err := t.GetRoom(ctx, roomCode)
	if err != nil {
		return nil, fmt.Errorf("verify reconnect token: %w", err)
	}
	if room == nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	if room.DisconnectedAt == nil {
		return nil, fmt.Errorf("invalid credentials")
	}
	if room.ReconnectToken != token {
		return nil, fmt.Errorf("invalid credentials")
	}
	// 60秒の有効期限チェック
	elapsed := time.Now().Unix() - *room.DisconnectedAt
	if elapsed > 60 {
		return nil, fmt.Errorf("reconnect token expired")
	}
	return room, nil
}

// ClearDisconnected は再接続成功時に切断情報をクリアし、新しい connectionID を設定する
// role に応じて hostConnectionId または guestConnectionId を新しい connectionID で更新する
// disconnectedAt, disconnectedRole, reconnectToken を削除する
func (t *RoomsTable) ClearDisconnected(ctx context.Context, roomCode, role, newConnID, reconnectToken string) error {
	var updateExpr string
	switch role {
	case "host":
		updateExpr = "SET hostConnectionId = :newConnID REMOVE disconnectedAt, disconnectedRole, reconnectToken"
	case "guest":
		updateExpr = "SET guestConnectionId = :newConnID REMOVE disconnectedAt, disconnectedRole, reconnectToken"
	default:
		return fmt.Errorf("invalid role: %s", role)
	}

	_, err := t.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(t.tableName),
		Key: map[string]types.AttributeValue{
			"roomCode": &types.AttributeValueMemberS{Value: roomCode},
		},
		ConditionExpression: aws.String("disconnectedRole = :role AND reconnectToken = :token"),
		UpdateExpression:    aws.String(updateExpr),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":newConnID": &types.AttributeValueMemberS{Value: newConnID},
			":role":      &types.AttributeValueMemberS{Value: role},
			":token":     &types.AttributeValueMemberS{Value: reconnectToken},
		},
	})
	if err != nil {
		return fmt.Errorf("clear disconnected (role=%s): %w", role, err)
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

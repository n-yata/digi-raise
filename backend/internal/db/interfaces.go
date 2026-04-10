package db

import (
	"context"
	"encoding/json"
)

// ConnectionStore は接続レコードの操作を抽象化するインターフェース
type ConnectionStore interface {
	Create(ctx context.Context, connID string) error
	Get(ctx context.Context, connID string) (*ConnectionRecord, error)
	Delete(ctx context.Context, connID string) error
	UpdateRoomCode(ctx context.Context, connID, roomCode string) error
	IncrementMessageCount(ctx context.Context, connID string) (int, error)
	ResetMessageCount(ctx context.Context, connID string) error
}

// RoomStore はルームレコードの操作を抽象化するインターフェース
type RoomStore interface {
	GetRoom(ctx context.Context, roomCode string) (*RoomRecord, error)
	DeleteRoom(ctx context.Context, roomCode string) error
	CreateRoom(ctx context.Context, roomCode, hostConnID string, hostCreature json.RawMessage) error
	JoinRoom(ctx context.Context, roomCode, guestConnID string, guestCreature json.RawMessage) (*RoomRecord, error)
	SetPlayerReady(ctx context.Context, roomCode, role string) (*RoomRecord, error)
	StartBattle(ctx context.Context, roomCode string) error
	SetAction(ctx context.Context, roomCode, role, action string) (*RoomRecord, error)
	AdvanceTurn(ctx context.Context, roomCode string) error
	SetDisconnected(ctx context.Context, roomCode, role, reconnectToken string) error
	SetFinished(ctx context.Context, roomCode, winner string) error
	VerifyReconnectToken(ctx context.Context, roomCode, token string) (*RoomRecord, error)
	ClearDisconnected(ctx context.Context, roomCode, role, newConnID, reconnectToken string) error
}

// ConfigStore は設定レコードの操作を抽象化するインターフェース
type ConfigStore interface {
	IsMaintenanceMode(ctx context.Context) (bool, error)
	SetMaintenanceMode(ctx context.Context, enabled bool) error
}

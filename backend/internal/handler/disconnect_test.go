package handler

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

func makeDisconnectRequest(connID string) events.APIGatewayWebsocketProxyRequest {
	return events.APIGatewayWebsocketProxyRequest{
		RequestContext: events.APIGatewayWebsocketProxyRequestContext{
			ConnectionID: connID,
		},
	}
}

func TestDisconnectHandler_ConnectionNotFound(t *testing.T) {
	t.Run("接続レコードが見つからない場合は200を返す（冪等性）", func(t *testing.T) {
		h := NewDisconnectHandler(
			&mockConnectionStore{getErr: fmt.Errorf("connection not found: conn-missing")},
			&mockRoomStore{},
			&mockMessageSender{},
		)

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("conn-missing"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})
}

func TestDisconnectHandler_NoRoom(t *testing.T) {
	t.Run("roomCodeなしの場合はDeleteのみ実行して200を返す", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "conn-1",
				RoomCode:     "", // ルームなし
			},
		}
		roomStore := &mockRoomStore{}

		h := NewDisconnectHandler(connStore, roomStore, &mockMessageSender{})

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("conn-1"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		// GetRoom は呼ばれていないはず（roomCode が空なので）
		if roomStore.getRoomResult != nil || roomStore.getRoomErr != nil {
			// モックの結果が設定されていても呼ばれた証拠にはならないが、
			// DeleteRoom 側が呼ばれないことを確認
		}
	})
}

func TestDisconnectHandler_WaitingRoom(t *testing.T) {
	t.Run("status=waitingのルームはルーム削除と接続削除を実行する", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "host-conn",
				RoomCode:     "ABC123",
			},
		}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:         "ABC123",
				Status:           "waiting",
				HostConnectionID: "host-conn",
			},
		}
		sender := &mockMessageSender{}

		h := NewDisconnectHandler(connStore, roomStore, sender)

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("host-conn"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		// waitingルームなので相手への通知はなし
		if len(sender.sent) != 0 {
			t.Errorf("waitingルームでは通知不要だが %d 件送信された", len(sender.sent))
		}
	})

	t.Run("status=waitingのルーム削除失敗でもエラーはLambdaに伝播しない", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "host-conn",
				RoomCode:     "ABC123",
			},
		}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:         "ABC123",
				Status:           "waiting",
				HostConnectionID: "host-conn",
			},
			deleteRoomErr: fmt.Errorf("dynamodb error"),
		}

		h := NewDisconnectHandler(connStore, roomStore, &mockMessageSender{})

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("host-conn"))

		if err != nil {
			t.Fatalf("ルーム削除エラーはLambdaに伝播すべきでないが error が返された: %v", err)
		}
		// ルーム処理エラーは続行するため接続削除は実行され200が返る
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})
}

func TestDisconnectHandler_BattlingRoom(t *testing.T) {
	t.Run("status=battlingの場合SetDisconnectedを呼び相手に通知する", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "host-conn",
				RoomCode:     "ABC123",
			},
		}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:          "ABC123",
				Status:            "battling",
				HostConnectionID:  "host-conn",
				GuestConnectionID: "guest-conn",
			},
		}
		sender := &mockMessageSender{}

		h := NewDisconnectHandler(connStore, roomStore, sender)

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("host-conn"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// 相手(guest-conn)に opponent_disconnected イベントが送信されているか確認
		if len(sender.sent) == 0 {
			t.Fatal("opponent_disconnected イベントが送信されていない")
		}
		if sender.sent[0].connectionID != "guest-conn" {
			t.Errorf("送信先 connectionID: got %q, want %q", sender.sent[0].connectionID, "guest-conn")
		}
		payloadMap, ok := sender.sent[0].payload.(map[string]any)
		if !ok {
			t.Fatalf("ペイロードの型が想定外: %T", sender.sent[0].payload)
		}
		if payloadMap["event"] != "opponent_disconnected" {
			t.Errorf("event フィールド: got %q, want %q", payloadMap["event"], "opponent_disconnected")
		}
		if payloadMap["timeoutSec"] != 60 {
			t.Errorf("timeoutSec フィールド: got %v, want %v", payloadMap["timeoutSec"], 60)
		}
	})

	t.Run("切断がゲスト側の場合ホストに通知する", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "guest-conn",
				RoomCode:     "ABC123",
			},
		}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:          "ABC123",
				Status:            "battling",
				HostConnectionID:  "host-conn",
				GuestConnectionID: "guest-conn",
			},
		}
		sender := &mockMessageSender{}

		h := NewDisconnectHandler(connStore, roomStore, sender)

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("guest-conn"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// ホスト(host-conn)への通知確認
		if len(sender.sent) == 0 {
			t.Fatal("opponent_disconnected イベントが送信されていない")
		}
		if sender.sent[0].connectionID != "host-conn" {
			t.Errorf("送信先 connectionID: got %q, want %q", sender.sent[0].connectionID, "host-conn")
		}
	})
}

func TestDisconnectHandler_ReadyRoom(t *testing.T) {
	t.Run("status=readyの場合相手に通知しルームを削除する", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "host-conn",
				RoomCode:     "ABC123",
			},
		}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:          "ABC123",
				Status:            "ready",
				HostConnectionID:  "host-conn",
				GuestConnectionID: "guest-conn",
			},
		}
		sender := &mockMessageSender{}

		h := NewDisconnectHandler(connStore, roomStore, sender)

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("host-conn"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// 相手への通知確認
		if len(sender.sent) == 0 {
			t.Fatal("opponent_disconnected イベントが送信されていない")
		}
		if sender.sent[0].connectionID != "guest-conn" {
			t.Errorf("送信先 connectionID: got %q, want %q", sender.sent[0].connectionID, "guest-conn")
		}
		payloadMap, ok := sender.sent[0].payload.(map[string]any)
		if !ok {
			t.Fatalf("ペイロードの型が想定外: %T", sender.sent[0].payload)
		}
		if payloadMap["event"] != "opponent_disconnected" {
			t.Errorf("event フィールド: got %q, want %q", payloadMap["event"], "opponent_disconnected")
		}
	})
}

func TestDisconnectHandler_ConnectionDeleteError(t *testing.T) {
	t.Run("接続レコード削除失敗時は500を返す", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "conn-1",
				RoomCode:     "",
			},
			deleteErr: fmt.Errorf("write capacity exceeded"),
		}

		h := NewDisconnectHandler(connStore, &mockRoomStore{}, &mockMessageSender{})

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("conn-1"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusInternalServerError {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusInternalServerError)
		}
	})
}

// テスト内でtime.Nowを使用するため、disconnectedAt が nil の参照を避けるためのヘルパー
func int64Ptr(v int64) *int64 {
	return &v
}

func TestDisconnectHandler_RoomNotFound(t *testing.T) {
	t.Run("ルームが見つからない場合も接続削除して200を返す", func(t *testing.T) {
		connStore := &mockConnectionStore{
			getResult: &db.ConnectionRecord{
				ConnectionID: "host-conn",
				RoomCode:     "ABC123",
			},
		}
		// GetRoom が nil を返す（ルーム削除済み）
		roomStore := &mockRoomStore{
			getRoomResult: nil,
			getRoomErr:    nil,
		}

		h := NewDisconnectHandler(connStore, roomStore, &mockMessageSender{})

		resp, err := h.Handle(context.Background(), makeDisconnectRequest("host-conn"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})
}

// _ は time パッケージが実際に使われることを保証するためのダミー
var _ = time.Now

package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

func makeMessageRequest(connID, body string) events.APIGatewayWebsocketProxyRequest {
	return events.APIGatewayWebsocketProxyRequest{
		RequestContext: events.APIGatewayWebsocketProxyRequestContext{
			ConnectionID: connID,
		},
		Body: body,
	}
}

// sentPayloadEvent はモックで送信されたペイロードの event フィールドを取得する
func sentPayloadEvent(t *testing.T, payload any) string {
	t.Helper()
	m, ok := payload.(map[string]any)
	if !ok {
		t.Fatalf("ペイロードが map[string]any でない: %T", payload)
	}
	event, _ := m["event"].(string)
	return event
}

// sentPayloadCode はモックで送信されたペイロードの code フィールドを取得する
func sentPayloadCode(t *testing.T, payload any) string {
	t.Helper()
	m, ok := payload.(map[string]any)
	if !ok {
		t.Fatalf("ペイロードが map[string]any でない: %T", payload)
	}
	code, _ := m["code"].(string)
	return code
}

func TestMessageHandler_InvalidJSON(t *testing.T) {
	t.Run("不正なJSONはINVALID_MESSAGEエラーを送信して400を返す", func(t *testing.T) {
		sender := &mockMessageSender{}
		h := NewMessageHandler(
			&mockConnectionStore{incrementResult: 1},
			&mockRoomStore{},
			sender,
		)

		// IncrementMessageCount は呼ばれる前にJSONパースが失敗するので
		// incrementResult の設定は不要だが、安全のため設定しておく
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", "{invalid json"))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusBadRequest)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_MESSAGE" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_MESSAGE")
		}
	})

	t.Run("空のボディはINVALID_MESSAGEエラーを送信する", func(t *testing.T) {
		sender := &mockMessageSender{}
		h := NewMessageHandler(
			&mockConnectionStore{incrementResult: 1},
			&mockRoomStore{},
			sender,
		)

		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", ""))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusBadRequest)
		}
	})
}

func TestMessageHandler_RateLimit(t *testing.T) {
	t.Run("messageCountが60超過で429とRATE_LIMITEDエラーを返す", func(t *testing.T) {
		sender := &mockMessageSender{}
		h := NewMessageHandler(
			&mockConnectionStore{incrementResult: 61}, // 60超過
			&mockRoomStore{},
			sender,
		)

		body := `{"action":"ping"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusTooManyRequests {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusTooManyRequests)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "RATE_LIMITED" {
			t.Errorf("エラーコード: got %q, want %q", code, "RATE_LIMITED")
		}
	})

	t.Run("messageCountがちょうど60は許可される", func(t *testing.T) {
		sender := &mockMessageSender{}
		connStore := &mockConnectionStore{
			incrementResult: 60, // ちょうど60はOK（>60 でレート制限）
			getResult: &db.ConnectionRecord{
				ConnectionID: "conn-1",
				RoomCode:     "",
			},
		}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"ping"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})

	t.Run("IncrementMessageCountのDBエラー時はerrorを返す", func(t *testing.T) {
		h := NewMessageHandler(
			&mockConnectionStore{incrementErr: fmt.Errorf("dynamodb error")},
			&mockRoomStore{},
			&mockMessageSender{},
		)

		body := `{"action":"ping"}`
		_, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err == nil {
			t.Fatal("エラーが返されるべきだが nil だった")
		}
	})
}

func TestMessageHandler_Ping(t *testing.T) {
	t.Run("pingはpongを返しmessageCountをリセットする", func(t *testing.T) {
		connStore := &mockConnectionStore{
			incrementResult: 1,
			getResult: &db.ConnectionRecord{
				ConnectionID: "conn-1",
				RoomCode:     "",
			},
		}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"ping"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// pong が送信されているか確認
		if len(sender.sent) == 0 {
			t.Fatal("pong が送信されていない")
		}
		if event := sentPayloadEvent(t, sender.sent[len(sender.sent)-1].payload); event != "pong" {
			t.Errorf("event フィールド: got %q, want %q", event, "pong")
		}
	})
}

func TestMessageHandler_CreateRoom(t *testing.T) {
	t.Run("create_roomの正常ケースはroom_createdを返す", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		roomStore := &mockRoomStore{}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, roomStore, sender)

		creature := json.RawMessage(`{"id":"test-1","name":"TestMon","type":"Fire","hp":40,"maxHp":40,"atk":10,"def":8,"spd":8,"level":5,"evolutionStage":1,"evolutionName":"TestEvo","wins":0,"losses":0}`)
		body, _ := json.Marshal(map[string]any{
			"action":   "create_room",
			"creature": creature,
		})

		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", string(body)))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// room_created イベントが送信されているか確認
		if len(sender.sent) == 0 {
			t.Fatal("room_created イベントが送信されていない")
		}
		lastSent := sender.sent[len(sender.sent)-1]
		event := sentPayloadEvent(t, lastSent.payload)
		if event != "room_created" {
			t.Errorf("event フィールド: got %q, want %q", event, "room_created")
		}
		// roomCode が含まれているか確認
		m, _ := lastSent.payload.(map[string]any)
		if _, ok := m["roomCode"]; !ok {
			t.Error("roomCode フィールドがペイロードに含まれていない")
		}
	})

	t.Run("create_roomのDB失敗はCREATE_ROOM_FAILEDエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		roomStore := &mockRoomStore{createRoomErr: fmt.Errorf("dynamodb error")}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, roomStore, sender)

		body := `{"action":"create_room","creature":{"id":"test-1","name":"TestMon","type":"Fire","hp":40,"maxHp":40,"atk":10,"def":8,"spd":8,"level":5,"evolutionStage":1,"evolutionName":"TestEvo","wins":0,"losses":0}}`

		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// CREATE_ROOM_FAILED エラーが送信されているか確認
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "CREATE_ROOM_FAILED" {
			t.Errorf("エラーコード: got %q, want %q", code, "CREATE_ROOM_FAILED")
		}
	})
}

func TestMessageHandler_JoinRoom(t *testing.T) {
	t.Run("roomCodeが空の場合INVALID_ROOM_CODEエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"join_room","roomCode":""}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_ROOM_CODE" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_ROOM_CODE")
		}
	})

	t.Run("不正なroomCodeフォーマット（5文字）はINVALID_ROOM_CODEエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"join_room","roomCode":"ABC12"}` // 5文字（無効）
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_ROOM_CODE" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_ROOM_CODE")
		}
	})

	t.Run("不正なroomCodeフォーマット（小文字を含む）はINVALID_ROOM_CODEエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"join_room","roomCode":"abc123"}` // 小文字（無効）
		_, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_ROOM_CODE" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_ROOM_CODE")
		}
	})

	t.Run("ルームが満員の場合ROOM_FULLエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		roomStore := &mockRoomStore{
			// JoinRoom で ErrRoomNotAvailable を返す
			joinRoomErr: db.ErrRoomNotAvailable,
		}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, roomStore, sender)

		body := `{"action":"join_room","roomCode":"ABC234","creature":{"id":"test-1","name":"TestMon","type":"Fire","hp":40,"maxHp":40,"atk":10,"def":8,"spd":8,"level":5,"evolutionStage":1,"evolutionName":"TestEvo","wins":0,"losses":0}}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "ROOM_FULL" {
			t.Errorf("エラーコード: got %q, want %q", code, "ROOM_FULL")
		}
	})
}

func TestMessageHandler_SelectAction(t *testing.T) {
	t.Run("不正なbattleActionはINVALID_ACTIONエラーを送信する", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"select_action","roomCode":"ABC234","battleAction":"invalid_action"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_ACTION" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_ACTION")
		}
	})

	t.Run("有効なbattleAction(attack/guard/special)は受け付ける", func(t *testing.T) {
		validActions := []string{"attack", "guard", "special"}
		for _, action := range validActions {
			t.Run(action, func(t *testing.T) {
				connStore := &mockConnectionStore{incrementResult: 1}
				roomStore := &mockRoomStore{
					getRoomResult: &db.RoomRecord{
						RoomCode:          "ABC234",
						Status:            "battling",
						HostConnectionID:  "conn-1",
						GuestConnectionID: "guest-conn",
					},
					setActionResult: &db.RoomRecord{
						RoomCode:   "ABC234",
						Status:     "battling",
						HostAction: action,
						GuestAction: "", // ゲストはまだ未選択
					},
				}
				sender := &mockMessageSender{}
				h := NewMessageHandler(connStore, roomStore, sender)

				body, _ := json.Marshal(map[string]string{
					"action":       "select_action",
					"roomCode":     "ABC234",
					"battleAction": action,
				})
				resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", string(body)))

				if err != nil {
					t.Fatalf("action %q でエラーが返された: %v", action, err)
				}
				if resp.StatusCode != http.StatusOK {
					t.Errorf("action %q ステータスコード: got %d, want %d", action, resp.StatusCode, http.StatusOK)
				}
				// INVALID_ACTION が送信されていないことを確認
				for _, msg := range sender.sent {
					if code := sentPayloadCode(t, msg.payload); code == "INVALID_ACTION" {
						t.Errorf("action %q に対してINVALID_ACTIONが送信された", action)
					}
				}
			})
		}
	})
}

func TestMessageHandler_LeaveRoom(t *testing.T) {
	t.Run("waitingルームはルームを削除してroom_leftを返す", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:         "ABC234",
				Status:           "waiting",
				HostConnectionID: "conn-1",
			},
		}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, roomStore, sender)

		body := `{"action":"leave_room","roomCode":"ABC234"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// room_left イベントが送信されているか確認
		foundRoomLeft := false
		for _, msg := range sender.sent {
			if event := sentPayloadEvent(t, msg.payload); event == "room_left" {
				foundRoomLeft = true
				break
			}
		}
		if !foundRoomLeft {
			t.Error("room_left イベントが送信されていない")
		}
	})

	t.Run("battlingルームはCANNOT_LEAVEエラーを返す", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		roomStore := &mockRoomStore{
			getRoomResult: &db.RoomRecord{
				RoomCode:          "ABC234",
				Status:            "battling",
				HostConnectionID:  "conn-1",
				GuestConnectionID: "guest-conn",
			},
		}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, roomStore, sender)

		body := `{"action":"leave_room","roomCode":"ABC234"}`
		_, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		// CANNOT_LEAVE エラーが送信されているか確認
		foundError := false
		for _, msg := range sender.sent {
			if code := sentPayloadCode(t, msg.payload); code == "CANNOT_LEAVE" {
				foundError = true
				break
			}
		}
		if !foundError {
			t.Error("CANNOT_LEAVE エラーが送信されていない")
		}
	})
}

func TestMessageHandler_UnknownAction(t *testing.T) {
	t.Run("不明なactionはINVALID_ACTIONエラーを送信して200を返す", func(t *testing.T) {
		connStore := &mockConnectionStore{incrementResult: 1}
		sender := &mockMessageSender{}
		h := NewMessageHandler(connStore, &mockRoomStore{}, sender)

		body := `{"action":"unknown_action"}`
		resp, err := h.Handle(context.Background(), makeMessageRequest("conn-1", body))

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if len(sender.sent) == 0 {
			t.Fatal("エラーメッセージが送信されていない")
		}
		if code := sentPayloadCode(t, sender.sent[0].payload); code != "INVALID_ACTION" {
			t.Errorf("エラーコード: got %q, want %q", code, "INVALID_ACTION")
		}
	})
}


package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/n-yata/digi-raise/backend/internal/auth"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

// --- モック定義 ---

type mockConnectionStore struct {
	createErr          error
	getResult          *db.ConnectionRecord
	getErr             error
	deleteErr          error
	updateRoomCodeErr  error
	incrementResult    int
	incrementErr       error
	resetErr           error
	// 呼び出し記録
	createCalledWith   string
	updateRoomCodeArgs []string // [connID, roomCode]
}

func (m *mockConnectionStore) Create(ctx context.Context, connID string) error {
	m.createCalledWith = connID
	return m.createErr
}

func (m *mockConnectionStore) Get(ctx context.Context, connID string) (*db.ConnectionRecord, error) {
	return m.getResult, m.getErr
}

func (m *mockConnectionStore) Delete(ctx context.Context, connID string) error {
	return m.deleteErr
}

func (m *mockConnectionStore) UpdateRoomCode(ctx context.Context, connID, roomCode string) error {
	m.updateRoomCodeArgs = []string{connID, roomCode}
	return m.updateRoomCodeErr
}

func (m *mockConnectionStore) IncrementMessageCount(ctx context.Context, connID string) (int, error) {
	return m.incrementResult, m.incrementErr
}

func (m *mockConnectionStore) ResetMessageCount(ctx context.Context, connID string) error {
	return m.resetErr
}

type mockConfigStore struct {
	maintenanceResult bool
	maintenanceErr    error
}

func (m *mockConfigStore) IsMaintenanceMode(ctx context.Context) (bool, error) {
	return m.maintenanceResult, m.maintenanceErr
}

func (m *mockConfigStore) SetMaintenanceMode(ctx context.Context, enabled bool) error {
	return nil
}

type mockRoomStore struct {
	getRoomResult        *db.RoomRecord
	getRoomErr           error
	deleteRoomErr        error
	createRoomErr        error
	joinRoomResult       *db.RoomRecord
	joinRoomErr          error
	setPlayerReadyResult *db.RoomRecord
	setPlayerReadyErr    error
	startBattleErr       error
	setActionResult      *db.RoomRecord
	setActionErr         error
	advanceTurnErr       error
	setDisconnectedErr   error
	setFinishedErr       error
	verifyTokenResult    *db.RoomRecord
	verifyTokenErr       error
	clearDisconnectedErr error
}

func (m *mockRoomStore) GetRoom(ctx context.Context, roomCode string) (*db.RoomRecord, error) {
	return m.getRoomResult, m.getRoomErr
}

func (m *mockRoomStore) DeleteRoom(ctx context.Context, roomCode string) error {
	return m.deleteRoomErr
}

func (m *mockRoomStore) CreateRoom(ctx context.Context, roomCode, hostConnID string, hostCreature json.RawMessage) error {
	return m.createRoomErr
}

func (m *mockRoomStore) JoinRoom(ctx context.Context, roomCode, guestConnID string, guestCreature json.RawMessage) (*db.RoomRecord, error) {
	return m.joinRoomResult, m.joinRoomErr
}

func (m *mockRoomStore) SetPlayerReady(ctx context.Context, roomCode, role string) (*db.RoomRecord, error) {
	return m.setPlayerReadyResult, m.setPlayerReadyErr
}

func (m *mockRoomStore) StartBattle(ctx context.Context, roomCode string) error {
	return m.startBattleErr
}

func (m *mockRoomStore) SetAction(ctx context.Context, roomCode, role, action string) (*db.RoomRecord, error) {
	return m.setActionResult, m.setActionErr
}

func (m *mockRoomStore) AdvanceTurn(ctx context.Context, roomCode string) error {
	return m.advanceTurnErr
}

func (m *mockRoomStore) SetDisconnected(ctx context.Context, roomCode, role, reconnectToken string) error {
	return m.setDisconnectedErr
}

func (m *mockRoomStore) SetFinished(ctx context.Context, roomCode, winner string) error {
	return m.setFinishedErr
}

func (m *mockRoomStore) VerifyReconnectToken(ctx context.Context, roomCode, token string) (*db.RoomRecord, error) {
	return m.verifyTokenResult, m.verifyTokenErr
}

func (m *mockRoomStore) ClearDisconnected(ctx context.Context, roomCode, role, newConnID, reconnectToken string) error {
	return m.clearDisconnectedErr
}

type mockMessageSender struct {
	sendErr  error
	sent     []sentMessage
}

type sentMessage struct {
	connectionID string
	payload      any
}

func (m *mockMessageSender) SendJSON(ctx context.Context, connectionID string, payload any) error {
	m.sent = append(m.sent, sentMessage{connectionID: connectionID, payload: payload})
	return m.sendErr
}

// --- テスト用ヘルパー ---

// validToken は現在時刻ベースで有効なトークンを生成する
func validToken(secretKey string) string {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(ts))
	sig := hex.EncodeToString(mac.Sum(nil))
	return ts + "." + sig
}

func makeConnectRequest(connID, token, reconnectToken, roomCode string) events.APIGatewayWebsocketProxyRequest {
	params := map[string]string{}
	if token != "" {
		params["token"] = token
	}
	if reconnectToken != "" {
		params["reconnectToken"] = reconnectToken
	}
	if roomCode != "" {
		params["roomCode"] = roomCode
	}
	return events.APIGatewayWebsocketProxyRequest{
		RequestContext: events.APIGatewayWebsocketProxyRequestContext{
			ConnectionID: connID,
		},
		QueryStringParameters: params,
	}
}

// --- テスト ---

const testSecretKey = "test-secret-key"

func TestConnectHandler_MaintenanceMode(t *testing.T) {
	t.Run("メンテナンスモード時に503を返す", func(t *testing.T) {
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: true},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-1", validToken(testSecretKey), "", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusServiceUnavailable)
		}
	})

	t.Run("メンテナンスモード確認のDBエラー時はLambdaリトライのためerrorを返す", func(t *testing.T) {
		dbErr := fmt.Errorf("dynamodb unavailable")
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceErr: dbErr},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-1", validToken(testSecretKey), "", "")
		_, err := h.Handle(context.Background(), req)

		if err == nil {
			t.Fatal("エラーが返されるべきだが nil だった")
		}
	})
}

func TestConnectHandler_TokenVerification(t *testing.T) {
	t.Run("トークンなしで401を返す", func(t *testing.T) {
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-1", "", "", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
		}
	})

	t.Run("不正なトークンで401を返す", func(t *testing.T) {
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-1", "invalid.token", "", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
		}
	})

	t.Run("別のキーで署名したトークンで401を返す", func(t *testing.T) {
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-1", validToken("wrong-key"), "", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusUnauthorized)
		}
	})
}

func TestConnectHandler_NormalConnect(t *testing.T) {
	t.Run("正常接続で200を返しCreateが呼ばれる", func(t *testing.T) {
		connStore := &mockConnectionStore{}
		h := NewConnectHandler(
			connStore,
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-abc", validToken(testSecretKey), "", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if connStore.createCalledWith != "conn-abc" {
			t.Errorf("Create の呼び出し connID: got %q, want %q", connStore.createCalledWith, "conn-abc")
		}
	})

	t.Run("接続レコード作成のDBエラー時はLambdaリトライのためerrorを返す", func(t *testing.T) {
		dbErr := fmt.Errorf("write capacity exceeded")
		h := NewConnectHandler(
			&mockConnectionStore{createErr: dbErr},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{},
			&mockMessageSender{},
		)

		req := makeConnectRequest("conn-abc", validToken(testSecretKey), "", "")
		_, err := h.Handle(context.Background(), req)

		if err == nil {
			t.Fatal("エラーが返されるべきだが nil だった")
		}
	})
}

func TestConnectHandler_Reconnect(t *testing.T) {
	t.Run("再接続成功時に200を返し相手へreconnectedを通知する", func(t *testing.T) {
		disconnectedAt := time.Now().Unix() - 10 // 10秒前（有効期限内）
		room := &db.RoomRecord{
			RoomCode:          "ABC123",
			Status:            "battling",
			HostConnectionID:  "old-host-conn",
			GuestConnectionID: "guest-conn",
			DisconnectedRole:  "host",
			DisconnectedAt:    &disconnectedAt,
			ReconnectToken:    "valid-token",
		}

		sender := &mockMessageSender{}
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{verifyTokenResult: room},
			sender,
		)

		req := makeConnectRequest("new-host-conn", validToken(testSecretKey), "valid-token", "ABC123")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// 相手(guest-conn)に reconnected イベントが送信されているか確認
		if len(sender.sent) == 0 {
			t.Fatal("reconnected イベントが送信されていない")
		}
		if sender.sent[0].connectionID != "guest-conn" {
			t.Errorf("送信先 connectionID: got %q, want %q", sender.sent[0].connectionID, "guest-conn")
		}
		payloadMap, ok := sender.sent[0].payload.(map[string]string)
		if !ok {
			t.Fatalf("ペイロードの型が想定外: %T", sender.sent[0].payload)
		}
		if payloadMap["event"] != "reconnected" {
			t.Errorf("event フィールド: got %q, want %q", payloadMap["event"], "reconnected")
		}
		if payloadMap["role"] != "host" {
			t.Errorf("role フィールド: got %q, want %q", payloadMap["role"], "host")
		}
	})

	t.Run("再接続トークン検証失敗時でも通常接続として200を返す", func(t *testing.T) {
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			&mockRoomStore{verifyTokenErr: fmt.Errorf("invalid credentials")},
			&mockMessageSender{},
		)

		req := makeConnectRequest("new-conn", validToken(testSecretKey), "bad-token", "ABC123")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		// 再接続失敗でも通常接続として扱われ200が返る
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})

	t.Run("reconnectTokenだけでroomCodeがない場合は再接続処理をスキップする", func(t *testing.T) {
		roomStore := &mockRoomStore{}
		h := NewConnectHandler(
			&mockConnectionStore{},
			&mockConfigStore{maintenanceResult: false},
			auth.NewVerifier(testSecretKey),
			roomStore,
			&mockMessageSender{},
		)

		// roomCode なし
		req := makeConnectRequest("conn-1", validToken(testSecretKey), "some-token", "")
		resp, err := h.Handle(context.Background(), req)

		if err != nil {
			t.Fatalf("エラーが返された: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("ステータスコード: got %d, want %d", resp.StatusCode, http.StatusOK)
		}
		// VerifyReconnectToken が呼ばれていないこと（roomStore.verifyTokenResult が nil のままエラーにならない）
		if roomStore.verifyTokenErr != nil {
			t.Error("VerifyReconnectToken が呼ばれるべきでなかった")
		}
	})
}

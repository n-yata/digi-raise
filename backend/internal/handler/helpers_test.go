package handler

import (
	"testing"

	"github.com/n-yata/digi-raise/backend/internal/db"
)

func TestIsValidRoomCode(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{
			name:  "正常: 大文字英字と有効数字の組み合わせ",
			input: "ABC234",
			want:  true,
		},
		{
			name:  "正常: 大文字のみ6文字",
			input: "ZZZZZZ",
			want:  true,
		},
		{
			name:  "空文字列は無効",
			input: "",
			want:  false,
		},
		{
			name:  "5文字は無効（短すぎる）",
			input: "ABC23",
			want:  false,
		},
		{
			name:  "7文字は無効（長すぎる）",
			input: "ABC2345",
			want:  false,
		},
		{
			name:  "小文字は無効",
			input: "abc234",
			want:  false,
		},
		{
			name:  "数字 '0' を含む場合は無効",
			input: "ABC230",
			want:  false,
		},
		{
			name:  "数字 '1' を含む場合は無効",
			input: "ABC231",
			want:  false,
		},
		{
			name:  "特殊文字を含む場合は無効",
			input: "ABC2!4",
			want:  false,
		},
		{
			name:  "スペースを含む場合は無効",
			input: "ABC 34",
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isValidRoomCode(tt.input)
			if got != tt.want {
				t.Errorf("isValidRoomCode(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsValidBattleAction(t *testing.T) {
	tests := []struct {
		name   string
		action string
		want   bool
	}{
		{
			name:   "attack は有効",
			action: "attack",
			want:   true,
		},
		{
			name:   "guard は有効",
			action: "guard",
			want:   true,
		},
		{
			name:   "special は有効",
			action: "special",
			want:   true,
		},
		{
			name:   "空文字列は無効",
			action: "",
			want:   false,
		},
		{
			name:   "大文字 ATTACK は無効（大文字小文字を区別する）",
			action: "ATTACK",
			want:   false,
		},
		{
			name:   "heal は無効（未定義アクション）",
			action: "heal",
			want:   false,
		},
		{
			name:   "末尾スペース付きの attack は無効",
			action: "attack ",
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isValidBattleAction(tt.action)
			if got != tt.want {
				t.Errorf("isValidBattleAction(%q) = %v, want %v", tt.action, got, tt.want)
			}
		})
	}
}

func TestGetOpponentRole(t *testing.T) {
	tests := []struct {
		name  string
		role  string
		want  string
	}{
		{
			name: "host の相手は guest",
			role: "host",
			want: "guest",
		},
		{
			name: "guest の相手は host",
			role: "guest",
			want: "host",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getOpponentRole(tt.role)
			if got != tt.want {
				t.Errorf("getOpponentRole(%q) = %q, want %q", tt.role, got, tt.want)
			}
		})
	}
}

func TestGetConnIDForRole(t *testing.T) {
	room := &db.RoomRecord{
		HostConnectionID:  "conn-host-123",
		GuestConnectionID: "conn-guest-456",
	}

	tests := []struct {
		name string
		role string
		want string
	}{
		{
			name: "host ロールはホストのconnectionIDを返す",
			role: "host",
			want: "conn-host-123",
		},
		{
			name: "guest ロールはゲストのconnectionIDを返す",
			role: "guest",
			want: "conn-guest-456",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getConnIDForRole(tt.role, room)
			if got != tt.want {
				t.Errorf("getConnIDForRole(%q, room) = %q, want %q", tt.role, got, tt.want)
			}
		})
	}
}

func TestGetRoleForConn(t *testing.T) {
	room := &db.RoomRecord{
		HostConnectionID:  "conn-host-123",
		GuestConnectionID: "conn-guest-456",
	}

	tests := []struct {
		name   string
		connID string
		want   string
	}{
		{
			name:   "ホストのconnectionIDは host を返す",
			connID: "conn-host-123",
			want:   "host",
		},
		{
			name:   "ゲストのconnectionIDは guest を返す",
			connID: "conn-guest-456",
			want:   "guest",
		},
		{
			name:   "不明なconnectionIDは空文字を返す",
			connID: "conn-unknown-789",
			want:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getRoleForConn(tt.connID, room)
			if got != tt.want {
				t.Errorf("getRoleForConn(%q, room) = %q, want %q", tt.connID, got, tt.want)
			}
		})
	}
}

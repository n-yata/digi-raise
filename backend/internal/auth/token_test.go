package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"testing"
	"time"
)

// testComputeHMAC はテスト用のトークン生成ヘルパー（token.go の computeHMAC と同じロジック）
func testComputeHMAC(message, key string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}

// buildToken はテスト用に有効なトークン文字列を生成する
func buildToken(timestampStr, secretKey string) string {
	h := testComputeHMAC(timestampStr, secretKey)
	return fmt.Sprintf("%s.%s", timestampStr, h)
}

func TestVerify(t *testing.T) {
	const secretKey = "test-secret-key"
	v := NewVerifier(secretKey)

	t.Run("正常系: 有効なトークンが検証を通過する", func(t *testing.T) {
		now := time.Now().Unix()
		token := buildToken(fmt.Sprintf("%d", now), secretKey)
		if err := v.Verify(token); err != nil {
			t.Errorf("有効なトークンが拒否された: %v", err)
		}
	})

	t.Run("フォーマット不正: ドットなしの文字列", func(t *testing.T) {
		if err := v.Verify("invalidtoken"); err == nil {
			t.Error("フォーマット不正なトークンがエラーなしで通過した")
		}
	})

	t.Run("フォーマット不正: 空文字列", func(t *testing.T) {
		if err := v.Verify(""); err == nil {
			t.Error("空文字列がエラーなしで通過した")
		}
	})

	t.Run("タイムスタンプ不正: 数値でない文字列", func(t *testing.T) {
		h := testComputeHMAC("notanumber", secretKey)
		token := fmt.Sprintf("notanumber.%s", h)
		if err := v.Verify(token); err == nil {
			t.Error("数値でないタイムスタンプがエラーなしで通過した")
		}
	})

	t.Run("期限切れ: 現在時刻より61秒前のタイムスタンプ", func(t *testing.T) {
		ts := time.Now().Unix() - 61
		token := buildToken(fmt.Sprintf("%d", ts), secretKey)
		if err := v.Verify(token); err == nil {
			t.Error("61秒前のトークンがエラーなしで通過した")
		}
	})

	t.Run("期限切れ: 現在時刻より61秒後のタイムスタンプ（未来すぎる）", func(t *testing.T) {
		ts := time.Now().Unix() + 61
		token := buildToken(fmt.Sprintf("%d", ts), secretKey)
		if err := v.Verify(token); err == nil {
			t.Error("61秒後のトークンがエラーなしで通過した")
		}
	})

	t.Run("境界値: ちょうど60秒前（有効）", func(t *testing.T) {
		ts := time.Now().Unix() - 60
		token := buildToken(fmt.Sprintf("%d", ts), secretKey)
		if err := v.Verify(token); err != nil {
			t.Errorf("ちょうど60秒前のトークンが拒否された: %v", err)
		}
	})

	t.Run("HMAC不一致: 正しいタイムスタンプ + 不正なHMAC", func(t *testing.T) {
		ts := fmt.Sprintf("%d", time.Now().Unix())
		token := fmt.Sprintf("%s.invalidsignature000000000000000000000000000000000000000000000000", ts)
		if err := v.Verify(token); err == nil {
			t.Error("不正なHMACがエラーなしで通過した")
		}
	})

	t.Run("異なるシークレットキーで生成したトークンは拒否される", func(t *testing.T) {
		ts := fmt.Sprintf("%d", time.Now().Unix())
		token := buildToken(ts, "different-secret-key")
		if err := v.Verify(token); err == nil {
			t.Error("別シークレットで生成したトークンがエラーなしで通過した")
		}
	})
}

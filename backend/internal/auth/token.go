package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// tokenValidWindow はトークンの有効期間（秒）
const tokenValidWindow = 60

// Verifier はHMACトークンを検証する
type Verifier struct {
	secretKey string
}

// NewVerifier は新しい Verifier を作成する
func NewVerifier(secretKey string) *Verifier {
	return &Verifier{secretKey: secretKey}
}

// Verify はクエリパラメータの token を検証する
// token フォーマット: "{timestamp}.{hmac_hex}"
// - timestamp は Unix秒の文字列
// - hmac = HMAC-SHA256(timestamp, secretKey) の hex エンコード
// - timestamp が現在時刻 ±60秒以内かチェック
func (v *Verifier) Verify(token string) error {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid token format")
	}

	timestampStr := parts[0]
	receivedHMAC := parts[1]

	// タイムスタンプをパース
	timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid timestamp: %w", err)
	}

	// タイムスタンプの有効期間チェック
	now := time.Now().Unix()
	diff := now - timestamp
	if diff < -tokenValidWindow || diff > tokenValidWindow {
		return fmt.Errorf("token expired: timestamp=%d, now=%d", timestamp, now)
	}

	// HMAC 検証
	expected := computeHMAC(timestampStr, v.secretKey)
	if !hmac.Equal([]byte(receivedHMAC), []byte(expected)) {
		return fmt.Errorf("invalid hmac")
	}

	return nil
}

// computeHMAC は HMAC-SHA256(message, key) の hex エンコード文字列を返す
func computeHMAC(message, key string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}

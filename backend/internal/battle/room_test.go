package battle

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestGenerateRoomCode(t *testing.T) {
	t.Run("6文字を返す", func(t *testing.T) {
		code, err := generateRoomCode()
		if err != nil {
			t.Fatalf("generateRoomCode がエラーを返した: %v", err)
		}
		if utf8.RuneCountInString(code) != roomCodeLength {
			t.Errorf("コードの長さが %d ではなく %d だった: %q", roomCodeLength, utf8.RuneCountInString(code), code)
		}
	})

	t.Run("許可された文字セットのみを含む", func(t *testing.T) {
		code, err := generateRoomCode()
		if err != nil {
			t.Fatalf("generateRoomCode がエラーを返した: %v", err)
		}
		for _, c := range code {
			if !strings.ContainsRune(roomCodeChars, c) {
				t.Errorf("許可されていない文字 %q がコード %q に含まれている", c, code)
			}
		}
	})

	t.Run("紛らわしい文字（I, O, 0, 1）を含まない", func(t *testing.T) {
		code, err := generateRoomCode()
		if err != nil {
			t.Fatalf("generateRoomCode がエラーを返した: %v", err)
		}
		forbiddenChars := "IO01"
		for _, c := range code {
			if strings.ContainsRune(forbiddenChars, c) {
				t.Errorf("紛らわしい文字 %q がコード %q に含まれている", c, code)
			}
		}
	})

	t.Run("100回呼んでも全て6文字で有効な文字のみ", func(t *testing.T) {
		for i := 0; i < 100; i++ {
			code, err := generateRoomCode()
			if err != nil {
				t.Fatalf("試行 %d 回目で generateRoomCode がエラーを返した: %v", i+1, err)
			}
			if utf8.RuneCountInString(code) != roomCodeLength {
				t.Errorf("試行 %d 回目: コードの長さが %d ではなく %d だった: %q", i+1, roomCodeLength, utf8.RuneCountInString(code), code)
			}
			for _, c := range code {
				if !strings.ContainsRune(roomCodeChars, c) {
					t.Errorf("試行 %d 回目: 許可されていない文字 %q がコード %q に含まれている", i+1, c, code)
				}
			}
		}
	})

	t.Run("毎回異なるコードを返す（10回中ユニーク数が5以上）", func(t *testing.T) {
		seen := make(map[string]struct{})
		const iterations = 10
		for i := 0; i < iterations; i++ {
			code, err := generateRoomCode()
			if err != nil {
				t.Fatalf("generateRoomCode がエラーを返した: %v", err)
			}
			seen[code] = struct{}{}
		}
		if len(seen) < 5 {
			t.Errorf("ランダム性が低い: %d 回中 %d 種類のユニークコードしか生成されなかった（最低5種類期待）", iterations, len(seen))
		}
	})
}

# タスクリスト: 卵の自動ふ化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-19 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260619-egg-auto-hatch/design.md` |
| 関連要求 | `.steering/20260619-egg-auto-hatch/requirements.md` |

---

## P1: 実装

- [x] **P1-1**: `App.tsx` — tick ループに stage 0 自動ふ化を追加（design.md §2.1）
- [x] **P1-2**: `App.tsx` — canEvolve useEffect に stage 0 自動ふ化を追加（design.md §2.2）
- [x] **P1-3**: `ActionButtons.tsx` — 卵ボタンを削除し `null` を返す（design.md §2.3）

## P2: ビルド検証

- [x] **P2-1**: `npm run build`（tsc + Vite）通過確認（今回変更由来のエラーなし。既存エラー2件は別タスク）

## P3: セキュリティレビュー + コミット

- [x] **P3-1**: クルトワ（security-engineer）へレビュー依頼
- [x] **P3-2**: Medium指摘（tick と useEffect の二重発火）を修正 → tick 側の stage 0 処理を削除し useEffect に一元化
- [x] **P3-3**: レビュー結果をシャビへ報告 → コミット承認取得（fix-creature-expressions マージに含まれて main に反映済み）
- [x] **P3-4**: コミット作成（同上・マージ済み）

---

作成: モドリッチ / 2026-06-19

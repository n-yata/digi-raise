# タスクリスト: 卵のドット絵化と数秒後の自動ふ化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-egg-analog-hatch/design.md` |

---

## P1: 実装

- [x] **P1-1**: `pixel/egg.ts` 新規（32×32 卵グリッド + `getEggPixel`）。非対称 ovoid（Hügelschäffer 卵曲線）で作成
- [x] **P1-2**: `pixel/index.ts` に `getEggPixel` を export 追加
- [x] **P1-3**: `CreatureSprite.tsx` を卵もドット絵描画へ変更（EggBody import 削除・未使用 color/TYPE_COLORS 除去）
- [x] **P1-4**: `App.tsx` stage 0 を「3秒後にメイン画面内でふ化演出」に変更（別画面へ遷移しない）
- [x] **P1-5**: `MainGame.tsx` + `index.css` にふ化演出（egg-wobble / egg-hatch / egg-hatch-flash）追加
- [x] **P1-6**: `EggBody.tsx` 削除

## P2: 品質チェック

- [x] **P2-1**: `npm run build`（tsc + Vite）通過
- [~] **P2-2**: `npm run lint` — eslint 未インストール（main でもローカル実行不可・既存環境問題）。tsc で代替確認
- [x] **P2-3**: `npm run test:run`（208 passed）
- [x] **P2-4**: 実機検証 — 卵表示（非作対称 ovoid）・3秒後メイン内ふ化（別画面遷移なし）をスクショ/DOMで確認

## P3: 永続ドキュメント更新

- [x] **P3-1**: architecture.md / repository-structure.md の EggBody 記述を更新

## P4: セキュリティレビュー + コミット

- [ ] **P4-1**: クルトワ（security-engineer）レビュー
- [ ] **P4-2**: 指摘対応 → コミット → push → PR 作成

---

作成: モドリッチ / 2026-06-20

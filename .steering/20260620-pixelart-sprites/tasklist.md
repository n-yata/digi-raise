# タスクリスト: クリーチャーの32×32ドット絵スプライト全面移行

進捗の正は本ファイル。実装中はリアルタイムに `[ ]`→`[x]` を更新する。

---

## P1. 基盤（パレット）

- [x] `src/components/creatures/pixel/palette.ts` を新規作成
  - [x] `hexToHsl` / `hslToHex` / `clampS` 純粋ユーティリティ
  - [x] `SHADE` / `BELLY` / `EYE_W` / `PUPIL` 定数
  - [x] `TypePalette` 型・`buildTypePalette(base)`・`TYPE_ACCENT`・`paletteFor(type)`
- [x] `fireAdult.ts` のパレットを `paletteFor('Fire')` 由来へ寄せる（整合・ハードコーディング排除）
  - [x] プロトの見た目が大きく崩れないことを画面で確認（生成色がプロト実測と±1〜3で一致）

## P2. Fire 縦展開（基準確立）

- [x] `fireBaby.ts`（stage1）
- [x] `fireChild.ts`（stage2）
- [x] `firePerfect.ts`（stage4）
- [x] `fireUltimate.ts`（stage5）
- [x] Fire 5体を `PIXEL_DISPATCH` に登録し、画面で確認（Fire/5 表示OK）

## P3. 横展開（残り5タイプ × 5ステージ = 25体）

- [x] Water 5体（Baby/Child/Adult/Perfect/Ultimate）
- [x] Plant 5体
- [x] Thunder 5体
- [x] Dark 5体
- [x] Light 5体
- [x] `index.ts` の `PIXEL_DISPATCH` を全30エントリへ拡張

## P4. 整合性テスト（ギュレル）

- [x] `src/components/creatures/pixel/__tests__/pixelSprites.test.ts` を作成
  - [x] T1: 全 grid が 32行×32文字
  - [x] T2: grid の各文字が palette キーまたは透明 `'.'`（未定義文字検出）
  - [x] T3: `PIXEL_DISPATCH` が 6×5=30 体すべて登録
  - [x] T4: 各 palette が共通キー `k/o/d/r/l/c/w/b` を含む
  - [x] T5: `buildTypePalette` の決定性・明度順序（o<d<r<l, k最暗）
- [x] `PIXEL_DISPATCH` を `index.ts` から export（テスト走査用）

## P5. 検証・仕上げ

- [x] 全 grid を機械検証（32×32・未定義文字なし）— 30体 fail:0 ALL OK
- [x] `npm run build`（型チェック）通過
- [x] `npm run test:run` 通過（208 passed）
- [x] `verify`: 代表タイプ/ステージを画面表示しスクショ確認（Fire/5・Water/3・Light/5）
- [ ] クルトワ（security-engineer）セキュリティレビュー（Critical/High なし）

## P6. リリース

- [ ] `.claude/README.md` 等カタログ影響の確認（pixel配下追加に伴う記載要否）
- [ ] retrospective.md 作成
- [ ] コミット（クルトワレビュー通過後）
- [ ] push → PR 作成 → main マージ（PR経由）
- [ ] worktree 片付け

---

## メモ
- 未登録タイプ/ステージは自動で従来SVGにフォールバック → 部分的に登録しても画面は壊れない（無停止移行）。
- スプライトデータは生HEX禁止。`palette: paletteFor(type)` を使う。
- 量産の土台は [design.md](./design.md) §3.3 シルエットテンプレ ＋ `fireAdult.ts`（陰影の教科書）。
- dev中に fireAdult.ts 編集の中間状態を vite HMR が掴みスタック → dev再起動で解消（本番ビルドは常に正常）。

# タスクリスト: タイトル画面とPWAアイコンの修正

## 背景
ゲームを32×32ドット絵へ刷新したが、タイトル画面の中央プレビューは色付きの丸、PWAアイコンは
滑らかなベクターのタマゴ＋テキストで、新ビジュアルと不整合。シャビ依頼で両方を修正する。

## P1. タイトル画面
- [x] 中央の色付き丸 → 本物のドット絵クリーチャー（`PixelSprite`、6タイプ巡回・glow連動）に差し替え
- [x] 星のチラつきバグ修正（useState 初期化で一度だけ生成し固定）
- [x] 配色・ロゴのレトロ調整（pixel-border パネル・glow・タイプドット強調・ロゴ影強化）

## P2. PWAアイコン（ドット絵＋PNG生成）
- [x] ドット絵アイコンを32×32グリッドで設計（中央に炎クリーチャー・マスカブル安全圏内）
- [x] `scripts/generate-icons.mjs`（pngjs）で icon-192.png / icon-512.png を整数倍(×6/×16)生成
- [x] 新しいドット絵 SVG（icon.svg, favicon用）も生成
- [x] `vite.config.ts` manifest を PNG アイコンへ更新（type image/png, purpose any maskable ＋ svg any）
- [x] `index.html` の favicon / apple-touch-icon を更新（apple-touch-icon を PNG に）
- [x] 旧 SVG アイコン（スマイル顔 icon-192/512.svg）を削除
- [x] `package.json` に `gen:icons` スクリプト追加（再生成可能に）

## P3. 検証・仕上げ
- [x] `npm run build` / `npm run test:run` 通過（212 passed）
- [x] タイトル画面をスクショ確認（Light/Water 巡回・glow・星固定を確認）
- [x] 生成アイコンPNG(512)を目視確認
- [ ] クルトワ（security-engineer）レビュー

## P4. リリース
- [ ] retrospective.md
- [ ] コミット → push → PR → main マージ → worktree 片付け

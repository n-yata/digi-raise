# 要求書: 標準クリーチャーグラフィックの SVG 化（絵文字排除）

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-03 |
| 担当 | モドリッチ |
| 関連スプリント | なし（本スプリントが UI 改善の起点） |

---

## 1. 背景

### 1.1 現状

- `frontend/src/components/CreatureSprite.tsx` の `PixelBody` は Stage 0（卵）〜 Stage 2（チャイルド）を CSS 図形（`radial-gradient` + `border-radius`）で描画しているが、**Stage 3 〜 Stage 5（アダルト・パーフェクト・アルティメット）は `SPRITE_EMOJIS[type][stage]` の絵文字を `font-size 52〜76px` で巨大化して表示しているだけ**である（`CreatureSprite.tsx:138-162`）。
- Stage 2 でも頭上にタイプ絵文字（`🔥💧🌿⚡🌑✨`）を載せている（`CreatureSprite.tsx:116-119`）。
- 結果、Fire のアダルト（`🐉`）と Water のアダルト（`🐋`）でシルエットの個性は出るものの、**クリーチャー固有のキャラクター性に欠け、進化での形の継承も無い**。
- バトル機能のバグ修正（直近 5 コミット中 2 件が `customSvg` 関連 fix）が落ち着き、UI ブラッシュアップに着手する適切なタイミング。

### 1.2 やりたいこと

標準クリーチャーグラフィックを **インライン SVG（React コンポーネント）** に置き換え、絵文字依存を排除する。タイプ × ステージごとの個性をシルエットで出し、進化で形を継承して「育てた感」を演出する。状態演出絵文字（`💤` `✨` `💧` `🍖` `⚠️`）は今回スコープ外（記号として直感的に機能しているため）。

---

## 2. ゴール

### 2.1 主目的

- クリーチャー本体の表示から絵文字を完全排除し、**6 タイプ × 5 ステージ = 30 体の標準 SVG** で個性ある見た目を実現する
- 進化時にシルエットの面影を継承し、ユーザーが「この子が大きくなった」と認識できる
- ターゲット値（参考）: Stage 3-5 の絵文字依存率 100% → 0%

### 2.2 副次目的

- タイプアイコン（`TYPE_EMOJIS`）も SVG 化し、UI 全体の画風を統一
- 将来のクリーチャー追加・新タイプ追加時に、**SVG コンポーネント追加だけ**で対応できる構造にする
- ユーザー描画機能（`customSvg`）と並列で「標準絵 ⇄ ユーザー絵」を選べるようにし、お絵描き機能の価値を高める

---

## 3. スコープ

### 3.1 含むもの

- `frontend/src/components/CreatureSprite.tsx` の `PixelBody` を全面刷新し、Stage 1 〜 Stage 5 を **インライン SVG コンポーネント** に置き換え
- Stage 0（卵）は現状の CSS 描画を維持（タイプカラーの差別化は既に出ている）
- `SPRITE_EMOJIS` 定数の削除
- `frontend/src/data/evolutions.ts` の `TYPE_EMOJIS` 利用箇所を `<TypeIcon type />` 等の SVG コンポーネントに置換（クリーチャーと画風統一）
- 既存アニメーション（`animate-happy-jump` 等）が SVG コンポーネント外側で従来通り動作することの担保
- **画風プロトタイプ（Fire 系列 5 体 + Fire タイプアイコン）をモドリッチが先に作成し、シャビ承認後にエンバペが残り展開** するフロー

### 3.2 含まないもの

- 状態演出絵文字（`💤 sleeping` `✨ happy` `💧 sad` `🍖 hungry` `⚠️ critical`）の刷新 → 現状維持
- ユーザー描画 SVG（`customSvg`）の機能変更 → 既存通り信頼境界内で `dangerouslySetInnerHTML` 経由表示を維持
- 進化条件・ステータス成長値・バトル計算式などゲームバランスに関わる変更 → 一切なし
- 新タイプ・新進化系統の追加 → なし
- アニメーション体系の刷新 → 既存の CSS アニメをそのまま流用

---

## 4. 機能要件

### 4.1 クリーチャー描画ロジック

1. `CreatureSprite.tsx` の `PixelBody` を `<DefaultCreatureBody type stage />` 形式のディスパッチコンポーネントに置換
2. ディスパッチ先は `type × stage` の組み合わせに対応する子コンポーネント（例: `FireBaby`, `FireChild`, ..., `FireUltimate`）。インライン SVG を返す
3. `customSvg` が存在する場合は従来通りユーザー描画を優先表示。存在しない場合のみ標準 SVG を表示（既存ロジック維持）
4. SVG の塗り色は `TYPE_COLORS` を参照し、定数の一元管理を継続

### 4.2 タイプアイコン

- `TYPE_EMOJIS` を直接利用している UI（メニュー・ステータス表示・タイプ選択画面等）を `<TypeIcon type size />` のような SVG コンポーネントに置換
- 利用箇所の調査と置換は実装フェーズで実施（design.md で対象洗い出し）

### 4.3 プロトタイプ承認フロー

1. **Phase A**: モドリッチが Fire 系列 5 体（Baby → Ultimate）+ Fire タイプアイコンを SVG で実装
2. **シャビ承認ゲート**: 画風（線の太さ／色／デフォルメ度／シルエット継承度）の OK を得る
3. **Phase B**: エンバペ（frontend-engineer）が残り 5 タイプ × 5 ステージ = 25 体 + 5 タイプアイコンを、確定画風に沿って実装
4. **Phase C**: クルトワ（security-engineer）レビュー → コミット

### 4.4 既存機能の互換要件

- `customSvg` がセットされたクリーチャーは従来通りユーザー描画を表示（標準 SVG にフォールバックしない）
- セーブデータ形式（IndexedDB / JSON エクスポート）は変更なし
- バトル中の相手クリーチャー描画も従来通り `customSvg` 優先（直近 fix 済みロジックを破らない）
- アニメ状態（`idle` `happy` `sleeping` `attack` `evolving` `dead` `sad` `hungry` `critical`）はすべて従来通り適用

---

## 5. 非機能要件

### 5.1 パフォーマンス

- バトル中 60fps 維持（既存目標）。SVG 1 体あたり要素数（path/circle/rect 等）は **30 ノード以下を目安**
- バンドルサイズ増加: gzip で **+30KB 以内** を目標（30 体分の SVG ＋ 6 タイプアイコン）
- 初回ロード LCP 2.5s 以下（既存目標）を逸脱しない

### 5.2 信頼性

- 標準 SVG コンポーネントは React 純粋（`dangerouslySetInnerHTML` 不使用）のため XSS リスクなし
- 万一 `type × stage` の組み合わせに対応コンポーネントが無い場合は、**タイプカラーの単純なシルエット**にフォールバック（クラッシュ禁止）

### 5.3 互換性・依存

- フロント: 既存の React + TypeScript + Vite + Tailwind スタック内で完結。**追加依存ライブラリは導入しない**（SVG は素の JSX で記述）
- バックエンド: 影響なし
- ハードコーディング禁止: SVG 内の色は `TYPE_COLORS`（`frontend/src/data/evolutions.ts`）から取得し、コンポーネント内に色値リテラルを埋め込まない

### 5.4 セキュリティ

- 標準クリーチャー SVG: React コンポーネントとしてインライン記述（`dangerouslySetInnerHTML` 不使用）
- ユーザー描画 SVG（`customSvg`）: 既存ナレッジ `docs/development-guidelines.md` E-4 の方針を踏襲（信頼境界内・エクスポート除外）
- 入力バリデーション要件なし（標準 SVG は静的アセット相当）

---

## 6. 制約・前提条件

- **画風はモドリッチが手描き SVG で起こす**（外部イラストレーター不在）。アイコン的なシルエット重視の作風になる前提
- **シャビ承認ゲートが Phase A → B の間に必須**（画風が確定するまで Phase B に入らない）
- **PWA Service Worker キャッシュ更新問題**（`docs/development-guidelines.md` A-7）に注意。SVG 変更後は dev 時に Service Worker をクリアして検証する
- **`dangerouslySetInnerHTML` 禁止方針**（`docs/development-guidelines.md` セキュリティ規約）を破らない。標準 SVG は JSX で記述
- **クルトワレビュー必須**（Phase C）
- **ゲームバランスへの影響なし**のため、ゲームデザイン判断のシャビ確認（CLAUDE.md）は不要

---

## 7. 受け入れ条件

- [ ] `CreatureSprite.tsx` から `SPRITE_EMOJIS` 定数が削除されている
- [ ] Stage 1 〜 Stage 5 の全 6 タイプで、絵文字を使わない SVG が表示される
- [ ] Stage 2 のクリーチャー頭上に絵文字が表示されない（タイプアイコンが必要なら SVG で）
- [ ] `TYPE_EMOJIS` を直接表示している UI がすべて `<TypeIcon>` 系コンポーネントに置換されている
- [ ] 既存アニメ状態（`idle` `happy` `sleeping` `attack` `evolving` `dead` `sad` `hungry` `critical`）が SVG 上で正しく動作
- [ ] 既存セーブデータをロードして全クリーチャーが正しく描画される（type × stage の全組み合わせを目視確認）
- [ ] `customSvg` がセットされた個体は引き続きユーザー描画を表示する
- [ ] バンドルサイズ増加が `npm run build` 計測で gzip +30KB 以内
- [ ] バトル中 60fps 維持（DevTools Performance で目視確認）
- [ ] 既存ナレッジ A-7（PWA キャッシュ）E-4（カスタム SVG XSS 経路）を破らない
- [ ] クルトワ（security-engineer）レビューで Critical/High なし

---

## 8. 未確定事項（design.md でバルベルデと協議）

- Q1. SVG コンポーネントのファイル分割粒度（タイプごとに 1 ファイル `FireSprites.tsx` にまとめるか、`type × stage` ごとに細分化するか、すべて `creatureSvgs.tsx` に集約するか）
- Q2. シルエット継承の実装パターン（共通パーツ `<BaseEye />` `<BaseFlame />` 等を抽出してコンポジションするか、各 SVG を独立で描くか）
- Q3. プロトタイプの画風方針（① 太線アウトライン＋単色塗り／② グラデーション多用／③ ピクセル風 `<rect>` グリッド）—— Phase A で実物を見て決定
- Q4. タイプアイコンとクリーチャー SVG の画風統一方法（design.md で「見た目言語」を共通定義するか、個別最適でいくか）
- Q5. Stage 0（卵）の現状 CSS 描画を維持するか、整合性のため SVG 化するか

---

作成: モドリッチ / 2026-05-03

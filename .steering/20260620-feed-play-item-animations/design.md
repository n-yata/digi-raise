# 設計: 食事・遊びアクション演出の強化

## 全体方針
既存の「アクション演出」基盤（`App.tsx` の `actionAnimation` + `triggerAction`）を拡張し、
演出中に「アイテム（食べ物 / 遊び道具）」のドット絵を併せて表示する。表示は新規の軽量
ドット絵レンダラ `ItemSprite` で行い、クリーチャー本体の `PixelSprite` と画風を統一する。

## 新規ファイル
- `src/components/items/ItemSprite.tsx`
  - 文字グリッド + パレットを `<svg>` で描画する汎用レンダラ。`PixelSprite` と同じ方式だが、
    viewBox をグリッド寸法から動的に算出する（アイテムは 16×16 など小さめ）。
- `src/components/items/foodSprites.ts`
  - 食べ物ドット絵 3 種（肉 / りんご / おにぎり）の `ItemSpriteData[]`。
- `src/components/items/toySprites.ts`
  - 遊び道具ドット絵 3 種（ボール / ディスク / ぬいぐるみ）の `ItemSpriteData[]`。

## 変更ファイル
### `src/App.tsx`
- 新規 state: `actionItem: { kind: 'food' | 'toy'; index: number } | null`
- `triggerAction(kind, item)` を拡張し、演出開始時に `actionItem` も同時セット、
  `ACTION_ANIM_MS` 経過後に両方クリア。
- `handleFeed`: ランダムな food index を選び `triggerAction('eating', { kind: 'food', index })`。
- `handlePlay`: ランダムな toy index を選び `triggerAction('happy', { kind: 'toy', index })`。
- 新規 `skipAction()`: タイマーを破棄し `actionAnimation` / `actionItem` を即クリア。
- `MainGame` に `actionItem` と `onSkipAction` を渡す。

### `src/components/MainGame.tsx`
- `actionItem` があるとき、クリーチャー表示エリアにアイテムのドット絵を
  オーバーレイ表示（クリーチャーの前方に配置し、登場アニメを付ける）。
- 演出再生中（`actionAnimation === 'eating' | 'happy'`）はクリーチャー表示エリアを
  タップ可能にし、`onSkipAction` を呼ぶ。視覚ヒント「タップでスキップ」を小さく表示。

## アニメーション
- 既存 CSS（`animate-eat-nod` / `animate-happy-jump`）はクリーチャー側でそのまま使用。
- アイテムは CSS keyframe で「出現 → 軽くバウンド」程度の動き。食べ物はクリーチャー口元、
  遊び道具はやや跳ねる配置。新規 keyframe は `src/index.css`（既存アニメ定義箇所）に追加。

## ランダム選択
- `Math.floor(Math.random() * SPRITES.length)` でインデックス選択（App コード内）。

## 不変条件
- `gameLogic.ts` の `feedCreature` / `playWithCreature` の数値計算は変更しない。

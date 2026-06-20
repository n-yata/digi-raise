# タスクリスト: 食事・遊びアクション演出の強化

## P1: アイテム描画基盤
- [x] `ItemSprite.tsx` 作成（グリッド寸法から viewBox 算出する汎用ドット絵レンダラ）

## P2: アイテムデータ
- [x] `foodSprites.ts` 作成（肉 / りんご / おにぎり の 3 種）
- [x] `toySprites.ts` 作成（ボール / ディスク / ぬいぐるみ の 3 種）

## P3: 状態・ハンドラ拡張（App.tsx）
- [x] `actionItem` state 追加
- [x] `triggerAction` をアイテム対応に拡張
- [x] `handleFeed` / `handlePlay` でランダムアイテム選択
- [x] `skipAction` 追加、MainGame へ props 受け渡し

## P4: 表示・スキップ（MainGame.tsx）
- [x] アイテムオーバーレイ表示
- [x] クリーチャー表示エリアのタップでスキップ＋ヒント表示
- [x] アイテム用 CSS keyframe 追加（index.css）

## P4.5: 演出リワーク（シャビ指摘対応）
- [x] アイコン静止表示 → クリーチャーと絡む動きへ刷新
- [x] 食事: 口元へ運ばれ数口かじって縮小消滅（foodEat）
- [x] 遊び: 道具別アニメ（ボール=弾む / ディスク=回転飛行 / ぬいぐるみ=ふわふわ）
- [x] 演出尺を 1200ms → 1600ms に延長

## P5: 品質チェック
- [x] `npx tsc --noEmit` パス
- [x] プレビューで食事・遊び・スキップを動作確認（computed animationName で検証）
- [x] アイテムデータの不変条件テスト追加（itemSprites.test.ts / 全243テストパス）
- [x] クルトワ（security-engineer）レビュー（Critical/High ゼロ）
- [ ] コミット → PR → マージ

# タスクリスト: メイン画面での即時アクション化（ミニゲーム廃止）

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-inline-main-screen-actions/design.md` |
| 関連要求 | `.steering/20260620-inline-main-screen-actions/requirements.md` |

---

## 進め方の原則

- 各タスクは [ ] 未着手 / [x] 完了 で管理
- 効果量・バランス数値は触らない（UI 配線とファイル削除のみ）
- 各 Phase は止まらず次へ。**止まるのはコミット前（P4）と Critical/High 指摘時のみ**

---

## P1: 実装（`src/App.tsx`）

- [x] **P1-1**: `handleFeed` をモーダル廃止・即時 `feedCreature` 適用へ書き換え（満腹ガード維持）
- [x] **P1-2**: `handleTrain` を `trainCreature(c, true)` 即時適用へ書き換え（攻撃アニメ＋成功メッセージ）
- [x] **P1-3**: `handlePlay` を `playWithCreature(c, true)` 即時適用へ書き換え
- [x] **P1-4**: `handleFeedDone` / `handleTrainResult` / `handlePlayResult` を削除
- [x] **P1-5**: `showFeedGame` / `showTrainingGame` / `showPlayGame` の state を削除
- [x] **P1-6**: 3つのミニゲームモーダルの条件付きレンダリングを削除
- [x] **P1-7**: `FeedMiniGame` / `TrainingMiniGame` / `PlayMiniGame` の import を削除

## P2: ファイル削除

- [x] **P2-1**: `src/components/FeedMiniGame.tsx` を削除
- [x] **P2-2**: `src/components/TrainingMiniGame.tsx` を削除
- [x] **P2-3**: `src/components/PlayMiniGame.tsx` を削除
- [x] **P2-4**: grep で MiniGame 参照が残っていないことを確認（参照ゼロ）

## P3: ビルド・検証

- [x] **P3-1**: `npm run build`（tsc + vite）成功
- [x] ~~**P3-2**: `npm run lint`（max-warnings 0）通過~~（スキップ: eslint が devDependencies 未定義でプロジェクト全体で実行不可。既存の環境欠落であり本変更とは無関係。tsc で型検証は担保。別途フラグ済み）
- [x] **P3-3**: verify スキルで dev サーバー起動 → feed/train/play の即時発動と効果量反映を確認（port5177 で確認: トレ ATK11→13/DEF10→11/SPD10→13・EXP+20、ご飯 空腹65→95、遊び 即時発動、いずれもモーダルなし・メイン画面維持）

## P4: クルトワ レビュー + コミット

- [ ] **P4-1**: 変更ファイルすべてをクルトワ（security-engineer）レビュー
- [ ] **P4-2**: Critical/High あれば修正（なければ次へ）
- [ ] **P4-3**: シャビへ報告 → コミット承認取得
- [ ] **P4-4**: コミット作成 → push → PR 作成

## P5: 仕上げ

- [ ] **P5-1**: `retrospective.md` を作成（学び・申し送り）
- [ ] **P5-2**: 永続ドキュメント影響確認（`docs/functional-design.md` のアクションフロー記述があれば更新）

---

作成: モドリッチ / 2026-06-20

# タスクリスト: トレーニングのミニゲーム復活とクリーチャーアクション演出追加

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-training-minigame-creature-action/design.md` |
| 関連要求 | `.steering/20260620-training-minigame-creature-action/requirements.md` |

---

## 進め方の原則

- フロントエンドのみ（バックエンド/DB/性能測定フェーズなし）
- 各タスクは [ ] 未着手 / [x] 完了 で管理
- 効果量・バランス数値は触らない（アニメ配線とミニゲーム復活のUI実装のみ）
- 各 Phase は止まらず次へ。**止まるのはコミット前（P4）と Critical/High 指摘時のみ**

---

## P1: gameLogic の型・アニメ状態拡張（`src/utils/gameLogic.ts`）

- [x] **P1-1**: `ActionAnim`（`'attack' | 'eating' | 'happy'`）型を定義・export
- [x] **P1-2**: `getAnimationState` の第2引数を `isAttacking: boolean` → `actionOverride: ActionAnim | null = null` に変更し、`if (actionOverride) return actionOverride` を dead 判定の直後に配置。戻り型に `'eating'` を追加
- [x] **P1-3**: 既存の効果量ロジック（feed/train/play）は一切変更しないことを diff で確認

## P2: トレーニング連打UI再作成（`src/components/TrainingMiniGame.tsx`）

> **方針変更（シャビ指示）**: モーダルの左右当て → メイン画面内オーバーレイの連打（サンドバッグ）。

- [x] ~~旧: モーダル＋左右当て50%（クリーチャー中央表示）~~（シャビ指示で連打・オーバーレイに作り直し）
- [x] **P2-1**: `Props { color; onResult(success) }` でオーバーレイUIに作り直し（クリーチャーは描画しない）
- [x] **P2-2**: `count`/`timeLeft`/`phase` 状態。マウント即 active、`TRAIN_DURATION_MS=3000` で終了
- [x] **P2-3**: エリア全体を透明タップ領域にし、active 中タップで `count++`
- [x] **P2-4**: 終了時に `onResult(count >= TRAIN_TARGET_TAPS)`（既定10回）。タイマーは done/unmount で clear
- [x] **P2-5**: 上部に「連打！」・残りタップ数・残り時間バーを表示（ブランチ色で装飾）

## P3: App / MainGame の配線

### P3-A: App.tsx

- [x] **P3-A-1**: `attackAnimation` state を `actionAnimation: ActionAnim | null` に置換、`ACTION_ANIM_MS = 1200` 定数追加
- [x] **P3-A-2**: `actionTimerRef` + `triggerAction(kind)` を実装（前タイマー clear・自動解除）。unmount cleanup で clear
- [x] **P3-A-3**: `handleFeed` に `triggerAction('eating')` を追加（即時適用・満腹ガード維持）
- [x] **P3-A-4**: `handlePlay` に `triggerAction('happy')` を追加（即時適用・就寝ガード維持）
- [x] **P3-A-5**: `handleTrain` を `setShowTrainingGame(true)` に変更（就寝ガード維持）、`showTrainingGame` state 復活
- [x] **P3-A-6**: `handleTrainResult(success)` を実装し `trainCreature(c, success)` 適用 + メッセージ
- [x] **P3-A-7**: ~~App でフルスクリーン `TrainingMiniGame` を描画~~ → MainGame に `trainingActive`/`onTrainResult` を渡す方式へ変更（オーバーレイは MainGame 側）
- [x] **P3-A-8**: MainGame へ渡す prop を `actionAnimation` に変更

### P3-B: MainGame.tsx

- [x] **P3-B-1**: prop `attackAnimation: boolean` → `actionAnimation: ActionAnim | null` に変更
- [x] **P3-B-2**: `getAnimationState(creature, actionAnimation)` に更新
- [x] **P3-B-3**: ambient 条件に `!actionAnimation && !trainingActive` を追加（アクション中・トレ中は徘徊停止）
- [x] **P3-B-4**: 新規 prop `trainingActive`/`onTrainResult` を受け取り、クリーチャー表示エリア内に `TrainingMiniGame` をオーバーレイ。連打中は spriteAnim を `attack` に上書き

## P4: ビルド・検証

- [x] **P4-1**: `npm run build`（tsc + vite）成功
- [x] **P4-2**: `npm run test:run` グリーン（235 passed。getAnimationState のテストを新 API に更新し eating/happy の新挙動テストを追加）
- [x] **P4-3**: verify スキルで dev サーバー起動（port5178）→ 実機確認完了
  - トレ: メイン画面内オーバーレイ（モーダルなし）で「連打！/あと N 回」表示、連打中クリーチャーは attack。87回タップ成功→ATK+1/DEF+3/SPD+1/EXP+20でLV2、無タップ失敗→小成長。成否分岐 OK
  - ごはん: 即時発動＋`animate-eat-nod`、空腹増加、モーダルなし
  - 遊び: 即時発動＋`animate-happy-jump`、モーダルなし
  - コンソールエラーなし

## P5: クルトワ レビュー + コミット

- [x] **P5-1**: 変更ファイルすべてをクルトワ（security-engineer）レビュー（ハードコーディング検出含む）→ Critical/High/Medium ゼロ
- [x] **P5-2**: Low 指摘（MainGame.test.tsx の旧 prop 残骸）を修正し、連打オーバーレイの新テスト3件を追加（238 passed）
- [ ] **P5-3**: シャビへ報告 → コミット承認取得
- [ ] **P5-4**: コミット作成 → push → PR 作成 → （承認後）マージ

## P6: 仕上げ

- [x] **P6-1**: `decisions.md` を作成し、D-1〜D-4（トレのミニゲーム化・連打採用・バランス数値・即時演出）をシャビ指示として記録
- [x] **P6-2**: `retrospective.md` を作成（学び・申し送り）
- [ ] **P6-3**: 永続ドキュメント影響確認（`docs/functional-design.md` のアクションフロー記述があれば更新を検討）

---

## 横断タスク（CLAUDE.md ルール）

- [ ] **X-1**: 各タスク着手前に対象ファイルを `Read` で最新確認
- [ ] **X-2**: フロント変更後は `npm run build` / `npm run test:run` で検証
- [ ] **X-3**: ゲームデザイン判断（D-2 見直し）は `decisions.md` に記録
- [ ] **X-4**: コミット前にクルトワへセキュリティレビュー依頼

---

作成: モドリッチ / 2026-06-20

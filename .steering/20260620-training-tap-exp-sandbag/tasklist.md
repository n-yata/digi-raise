# トレーニング改修: タップ比例EXP + サンドバッグ破壊演出

## 要求（シャビ指示）
- 3秒以内にタップした分だけ経験値を取得（成功/失敗の二値判定を廃止）
- サンドバッグを表示
- クリーチャーがサンドバッグをだんだん破壊する（3段階: 無傷→ヒビ→大破）

## ゲームデザイン決定（シャビ確認済み 2026-06-20）
- EXP: 2 × タップ数（上限なし）
- ステータス成長 atk/def/spd: 現状維持（ランダム 1〜3）
- サンドバッグ破壊: 3段階（無傷→ヒビ→大破）、タップ進捗に連動

## タスク
- [ ] P1: `trainCreature(creature, taps: number)` へシグネチャ変更（EXP=taps*2、stat=random 1〜3）
- [ ] P2: `TrainingMiniGame` をタップ数カウント方式へ。サンドバッグSVG + 3段階破壊表示。終了時 onResult(taps)
- [ ] P3: `MainGame` / `App` の onTrainResult を taps:number 受け渡しへ更新、メッセージ調整
- [ ] P4: `gameLogic.test.ts` の trainCreature テストを taps ベースへ更新
- [ ] P5: クルトワ セキュリティレビュー → コミット → PR
- [ ] P6: verify（実際に動かして確認）

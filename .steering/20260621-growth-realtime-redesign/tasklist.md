# タスクリスト: 成長システム リアルタイム化リデザイン

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-21 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260621-growth-realtime-redesign/design.md` |
| 関連要求 | `.steering/20260621-growth-realtime-redesign/requirements.md` |

---

## 進め方の原則

- フロント単独（React + Vite + TS）。型 → 定数/ロジック → 進化 → 永続化 → UI → テスト → 検証 → レビュー → ドキュメント。
- ハードコード禁止: 成長レート/しきい値は `gameLogic.ts` の名前付き定数に集約。
- コミット前は必ずクルトワ（security-engineer）レビュー。
- 各 Phase は完了次第、止まらず次へ。判断が要るときのみ停止。

---

## P1: 型・定数

- [x] **P1-1**: `src/types/creature.ts` に `fatigue: number`（裏パラメータ 0–100）を追加
- [x] **P1-2**: `src/utils/gameLogic.ts` 冒頭に成長レート定数を集約（`TICKS_PER_DAY` / `AGE_PER_TICK` / `HUNGER_DECAY_PER_TICK` / `FATIGUE_MAX` / `FATIGUE_TRAIN_COST` / `FATIGUE_PLAY_COST` / `TIRED_THRESHOLD` / `FATIGUE_RECOVERY_PER_TICK`）

## P2: コアロジック（gameLogic.ts）

- [x] **P2-1**: `createNewCreature` に `fatigue: 0` を追加
- [x] **P2-2**: `applyTimeUpdate` の年齢を `age += thirtyMinTicks * AGE_PER_TICK` に変更
- [x] **P2-3**: `applyTimeUpdate` のおなかを `hunger -= thirtyMinTicks * HUNGER_DECAY_PER_TICK` に変更
- [x] **P2-4**: `applyTimeUpdate` に疲労回復 `fatigue = clamp(fatigue - thirtyMinTicks * FATIGUE_RECOVERY_PER_TICK, 0, FATIGUE_MAX)` を追加
- [x] **P2-5**: `trainCreature` — 疲労MAXで no-op、`hunger -= 10` 削除、`fatigue += FATIGUE_TRAIN_COST`（幸福度/EXP/ステは維持）
- [x] **P2-6**: `playWithCreature` — 疲労MAXで no-op、`hunger -= 5` 削除、`fatigue += FATIGUE_PLAY_COST`（幸福度は維持）
- [x] **P2-7**: `getAnimationState` の戻り値ユニオンに `'tired'` を追加し、優先順位（hungry の次・sad の前、`fatigue>=TIRED_THRESHOLD`）に組み込む

## P3: 進化条件

- [x] **P3-1**: `src/data/evolutions.ts` の `EVOLUTION_REQUIREMENTS` minAge を日数化（0.5 / 1 / 3 / 7）＋コメント更新

## P4: 永続化

- [x] **P4-1**: `src/utils/storage.ts` `validateCreature` で `fatigue` を許容、レガシーは `fatigue ?? 0` で補完

## P5: UI

- [x] **P5-1**: `src/components/ActionButtons.tsx` トレ・遊ぶの `disabled` に `|| creature.fatigue >= FATIGUE_MAX` を追加
- [x] **P5-2**: `src/components/creatures/DefaultCreatureBody.tsx` の `AnimState` 型に `'tired'` を追加（`getExpression` にも tired 表情を追加）
- [x] **P5-3**: `src/components/CreatureSprite.tsx` `getAnimClass` に `tired` ケースを追加
- [x] **P5-4**: ~~`src/index.css` に keyframes 追加~~（実態に合わせ `tailwind.config.js` に `tired-droop` / `tiredDroop` を追加）

## P6: テスト更新

- [x] **P6-1**: `src/utils/gameLogic.test.ts` — hunger/age レート、train/play（hunger不変・fatigue加算・MAX no-op）、疲労回復、`getAnimationState('tired')` の期待値を更新
- [x] **P6-2**: `src/hooks/useTimeUpdate.test.ts` — makeCreature に fatigue 追加
- [x] **P6-3**: `src/utils/evolution.test.ts` — minAge 日数の期待値を更新
- [x] **P6-4**: 既存セーブ（fatigue欠落）が `validateCreature` で通ることのテストを追加（`storage.test.ts`）

## P7: ビルド・テスト検証

- [x] **P7-1**: `npm run test:run` 全パス（12ファイル / 290テスト）
- [x] ~~**P7-2**: `npm run lint`~~（実行不可: eslint がプロジェクト未導入＝devDependencies に無く設定ファイルも無い。既存状態であり本変更とは無関係。tsc で型チェックは通過済み）
- [x] **P7-3**: `npm run build`（tsc + vite）成功
- [x] **P7-4**: `implementation-validator`（ギュレル）で品質検証 → 合格 5/5

## P8: クルトワ（security-engineer）レビュー + コミット + PR

- [x] **P8-1**: 変更ファイル全件のセキュリティレビューをクルトワに依頼（ハードコーディング/入力検証/XSS 等）
- [x] **P8-2**: Critical/High なし（Low: fatigue 範囲検証は既存仕様と同水準で対応不要）
- [ ] **P8-3**: シャビへレビュー結果を報告 → コミット
- [ ] **P8-4**: push → PR 作成

## P9: ドキュメント・振り返り

- [x] **P9-1**: 永続ドキュメント（`docs/game-design.md` / `docs/glossary.md` / `docs/functional-design.md`）に疲労度・新レート・進化日数を反映
- [x] **P9-2**: `retrospective.md` を作成（計画と実績の差分・学び・申し送り）

---

## 横断タスク（CLAUDE.md ルール）

- [ ] **X-1**: 各タスク着手前に対象ファイルを `Read` で最新確認
- [ ] **X-2**: 変更後は `npm run build` / `test:run` / `lint` で検証
- [ ] **X-3**: 非自明な判断は design.md / retrospective.md に記録
- [ ] **X-4**: コミット前にクルトワのセキュリティレビュー

---

## 残る未確定事項（実装中に発生したらシャビ判断）

| # | 項目 | トリガ |
|---|------|------|
| Q1 | 既存 age 移行 | 現状「移行しない」。違和感が出たら別途マイグレーション検討 |
| Q4 | tired モーションの見た目 | 穏やかな俯きスウェイで実装。要調整ならスプライト方針と詰める |

---

作成: モドリッチ / 2026-06-21

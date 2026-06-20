# タスクリスト: クリーチャー進化系統リデザイン

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-creature-evolution-redesign/design.md` |
| 関連要求 | `.steering/20260620-creature-evolution-redesign/requirements.md` |

---

## 進め方の原則

- **型定義 → データ → ロジック → テスト → UI修正（最小限） → セキュリティレビュー → コミット**
- 各タスクは [ ] 未着手 / [x] 完了 で管理
- コミット前は **必ずクルトワ（security-engineer）レビュー**
- スプライト差し替え・タイプ相性廃止・UIカラー更新は今回スコープ外

---

## P1: worktree 作成

- [x] **P1-1**: feature ブランチ + worktree を作成

---

## P2: 型定義（`src/types/creature.ts`）

- [x] **P2-1**: `CreatureId` 型を新設（20体分の ID を定義）
- [x] **P2-2**: `CreatureType` を削除
- [x] **P2-3**: `Creature` インターフェースの `type` フィールドを `creatureId: CreatureId` に置き換え

---

## P3: 進化データ（`src/data/evolutions.ts`）

- [x] **P3-1**: `CreatureDefinition` インターフェースを新設
- [x] **P3-2**: `CREATURE_TREE` を新設（20体の定義を記述）
- [x] **P3-3**: `STAGE_NAMES` を維持（ステージ名は引き続き使用）
- [x] **P3-4**: `BASE_STATS` を維持
- [x] **P3-5**: `EVOLUTION_REQUIREMENTS` を維持（アダルト以降の進化条件は既存のまま）
- [x] **P3-6**: `EVOLUTION_NAMES`・`TYPE_COLORS`・`TYPE_BG_COLORS` を削除

---

## P4: 進化ロジック（`src/utils/evolution.ts`）

- [x] **P4-1**: `determineEvolutionTarget` を新設（幸福度ベースの分岐ロジック）
- [x] **P4-2**: `determineTypeFromRaising` を削除
- [x] **P4-3**: `canEvolve` を更新（`evolutionStage >= 5` → `evolvesTo.length === 0` ベースに）
- [x] **P4-4**: `evolveCreature` を更新（`creatureId` を次の ID に更新・`type` フィールド削除）
- [x] **P4-5**: `getEvolutionProgress` を更新（型エラー修正）

---

## P5: テスト（`src/utils/evolution.test.ts`）

- [x] **P5-1**: 幸福度境界値テスト（29/30/31/69/70/71）でのチャイルド分岐確認
- [x] **P5-2**: チャイルド→アダルト分岐（happiness >= 70 / < 70）の確認
- [x] **P5-3**: 終点クリーチャー（perfectA2/B2/C2）が進化不可であることを確認
- [x] **P5-4**: アルティメット（A/B/C）が進化不可であることを確認
- [x] **P5-5**: `npm run test:run` が通ることを確認

---

## P6: UI 型エラー修正（最小限）

- [x] **P6-1**: `creature.type` 参照箇所を `tsc --noEmit` でリストアップ
- [x] **P6-2**: 各箇所を `creature.creatureId` に置き換え（スタイルはブランチカラーに切替、スプライトは FallbackSilhouette に統一）
- [x] **P6-3**: `npm run build` が通ることを確認（222/222 テストすべて通過）

---

## P7: セキュリティレビュー + コミット

- [x] **P7-1**: クルトワ（security-engineer）に変更ファイルすべてのレビューを依頼
  - ハードコーディング検出・XSS・インジェクション等
- [x] **P7-2**: 指摘事項確認 → Critical / High なし
- [x] **P7-3**: M-1 指摘（hasOwnProperty.call）修正
- [x] **P7-4**: シャビへ結果報告 → コミット承認取得
- [x] **P7-5**: コミット作成・PR 作成 → https://github.com/n-yata/digi-raise/pull/20

---

## P8: ドキュメント更新

- [x] **P8-1**: `docs/functional-design.md` の進化システム表を新ツリーに更新
- [x] **P8-2**: `docs/glossary.md` に `CreatureId`・ブランチ用語を追加
- [x] **P8-3**: 振り返り（`retrospective.md`）を作成

---

## 進捗マイルストーン

| マイルストーン | 完了条件 |
|--------------|--------|
| **M1: 型定義完了** | P2・P3 完了、tsc エラーなし |
| **M2: ロジック完了** | P4 完了、テスト全通過 |
| **M3: ビルド通過** | P6 完了、`npm run build` 成功 ✅ |
| **M4: コミット完了** | P7 完了、PR 作成済み |

---

作成: モドリッチ / 2026-06-20

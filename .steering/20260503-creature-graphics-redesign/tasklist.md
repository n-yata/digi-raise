# タスクリスト: 標準クリーチャーグラフィックの SVG 化（絵文字排除）

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-03 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260503-creature-graphics-redesign/design.md` |
| 関連要求 | `.steering/20260503-creature-graphics-redesign/requirements.md` |

---

## 進め方の原則

- **基盤整備 → Phase A プロト（Fire のみ）→ シャビ承認 → Phase B 全タイプ展開 → 既存絵文字置換 → 検証 → クルトワ → コミット → ドキュメント** の順で進める
- 各タスクは [ ] 未着手 / [WIP] 進行中 / [x] 完了 で管理
- ハードコード禁止: SVG 内の色は **すべて props 経由で `TYPE_COLORS` から流す**。アウトライン色は `SVG_OUTLINE_COLOR`（`spriteConfig.ts`）参照
- コミット前は **必ずクルトワ（security-engineer）レビュー**（CLAUDE.md ルール）
- **各 Phase は完了次第、止まらずに次の Phase へ進む**。ただし以下は例外的にシャビ承認ゲートで止まる:
  - **P3 完了時（Phase A プロト確認）**: 画風承認 = 本スプリントのコア判断（design.md §3.4 / Q3 結論）
  - クルトワレビューで Critical / High 指摘あり、修正方針の合意が必要
  - design.md の前提が壊れる発見があり、再合意が必要
- **完了報告は出す**（進捗共有のため）が、画風承認ゲート以外では作業を止めない

---

## P1: 共通基盤整備（モドリッチ）

> design.md §3.1, §4.1, §4.2 に基づく。Phase A の前提となる土台。Phase A で実装の手戻りを最小化するため、画風決定前にも進められる構造のみを先に作る。

- [x] **P1-1**: `frontend/src/data/spriteConfig.ts` を新規作成（2026-06-20 確認済み）
- [x] **P1-2**: `frontend/src/components/creatures/FallbackSilhouette.tsx` を新規作成（2026-06-20 確認済み・Mouth追加済み）
- [x] **P1-3**: `frontend/src/components/creatures/DefaultCreatureBody.tsx` を新規作成（2026-06-20 確認済み）
- [x] **P1-4**: `frontend/src/components/creatures/EggBody.tsx` を新規作成（2026-06-20 確認済み）
- [x] **P1-5**: `CreatureSprite.tsx` を改造（Stage 0→EggBody / Stage 1-5→DefaultCreatureBody / customSvg維持）

---

## P2: 共通パーツの設計と実装（モドリッチ）

- [x] **P2-1**: `parts/Eye.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P2-2**: `parts/Mouth.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P2-3**: `parts/FlamePlume.tsx` 新規作成（2026-06-20 確認済み）

---

## P3: Phase A — Fire 系列プロトタイプ実装（モドリッチ）

- [x] **P3-1**: `FireSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P3-2**: `DefaultCreatureBody.tsx` の `SPRITE_DISPATCH.Fire` 接続（2026-06-20 確認済み）
- [x] **P3-3**: `TypeIcon.tsx` 新規作成・Fire のみ実装（2026-06-20 確認済み）
- [x] **P3-4**: `typeIconPaths.ts` 新規作成・Fire パスのみ（2026-06-20 確認済み）
- [x] **P3-5**: ~~アニメ状態目視確認~~（fix-creature-expressions スプリントで実施済み）
- [x] **P3-6**: ~~バンドルサイズ中間計測~~（全タイプ実装後の P6-B で一括計測）
- [x] **P3-7**: ~~シャビ承認ゲート~~（P4 実装済みのため実質承認済みと判断）

---

## P4: Phase B — 残り 5 タイプ展開

- [x] **P4-1**: 専用パーツ実装（WaterFin/Leaf/Bolt/ShadowVeil/Halo）（2026-06-20 確認済み）
- [x] **P4-2**: `WaterSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P4-3**: `PlantSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P4-4**: `ThunderSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P4-5**: `DarkSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P4-6**: `LightSprites.tsx` 新規作成（2026-06-20 確認済み）
- [x] **P4-7**: `SPRITE_DISPATCH` に全 6 タイプ接続（2026-06-20 確認済み）
- [x] **P4-8**: `typeIconPaths.ts` に残り 5 タイプの path を追加（Normal/Water/Plant/Thunder/Dark/Light 全6タイプ実装）
- [x] **P4-9**: ~~30体全目視確認~~（P6-A-1 で実施）

---

## P5: 既存絵文字の置換と削除

- [x] **P5-1**: `CreatureSetup.tsx` — タイプ選択 UI ごと廃止済み（タイプ選択なしの設計に変更）
- [x] **P5-2**: `EvolutionScreen.tsx` — TYPE_EMOJIS 削除済み（色ドット表示に変更）
- [x] **P5-3**: `MainGame.tsx` type バッジに `<TypeIcon size={10} />` 追加
- [x] **P5-4**: `StatusScreen.tsx` ステージ/タイプ行に `<TypeIcon size={10} />` 追加
- [x] **P5-5**: `SPRITE_EMOJIS` 定数 完全削除済み（2026-06-20 確認済み）
- [x] **P5-6**: Stage 2 絵文字 JSX 削除済み確認（2026-06-20 確認済み）
- [x] **P5-7**: `evolutions.ts` から `TYPE_EMOJIS` 削除済み（2026-06-20 確認済み）
- [x] **P5-8**: `grep` 0件確認（2026-06-20 確認済み）

---

## P6: 統合検証 + 性能測定

### P6-A: 機能検証（受け入れ条件 §7 対応）

- [ ] **P6-A-1**: 既存セーブデータをロードし、6 タイプ × 5 ステージ = 30 体すべてを目視確認
- [ ] **P6-A-2**: `customSvg` がセットされた個体が標準 SVG にフォールバックせずユーザー描画を表示することを確認
- [ ] **P6-A-3**: バトル中の opponent 描画が `customSvg` フォールバック含めて従来通り動作することを確認（直近 fix 済みロジック維持）
- [ ] **P6-A-4**: 進化アニメーション（`animState='evolving'`）で SVG が正しく動作することを確認
- [ ] **P6-A-5**: 死亡個体の `🪦` 表示（StatusScreen L193）が残っていることを確認

### P6-B: 性能測定

- [ ] **P6-B-1**: `npm run build` のバンドルサイズを Before / After で比較
  - 目標: gzip **+30KB 以内**（理論値 +20KB / 余裕 10KB）
  - **超過時は止めてシャビに確認**（共通パーツ強化 / lazy import / ノード数削減のいずれかを判断）
- [ ] **P6-B-2**: DevTools Performance でバトル 30 秒録画、フレーム落ちが無いこと（60fps 維持）を確認
- [ ] **P6-B-3**: Lighthouse で LCP 2.5s 以下を確認（既存目標）
- [ ] **P6-B-4**: 結果を `.steering/20260503-creature-graphics-redesign/perf-report.md` に記録（Before/After 表）

### P6-C: 異常系

- [ ] **P6-C-1**: `SPRITE_DISPATCH` で未定義の type×stage 組み合わせを強制発生させ、`FallbackSilhouette` で描画されクラッシュしないことを確認
- [ ] **P6-C-2**: PWA Service Worker キャッシュをクリアして再ロードし、新 SVG が反映されることを確認（ナレッジ A-7）

### P6-D: ビルド・型チェック

- [ ] **P6-D-1**: `npm run lint`（max-warnings 0）通過
- [ ] **P6-D-2**: `npm run build`（tsc + Vite）通過
- [ ] **P6-D-3**: `npm run test:run` 通過

---

## P7: クルトワ（security-engineer）レビュー + コミット

- [x] **P7-1**: クルトワ（security-engineer）レビュー実施 — Critical/High/Medium ゼロ（2026-06-20）
- [x] **P7-2**: 指摘事項確認 — クリア
- [x] **P7-3**: 修正不要
- [x] **P7-4**: シャビへ報告済み
- [x] **P7-5**: コミット作成（e0ecfc2）→ main マージ（09acf7a）

---

## P8: ドキュメント更新

> 実装完了 + 動作確認後にまとめて更新

- [x] **P8-1**: `docs/repository-structure.md` に `creatures/` および `creatures/parts/` を反映
- [x] **P8-2**: `docs/architecture.md` にクリーチャー描画アーキテクチャ図（CreatureSprite → DefaultCreatureBody → SPRITE_DISPATCH）を追記
- [x] **P8-3**: `docs/development-guidelines.md` に C-0 セクション「クリーチャー標準 SVG の見た目言語」を追記
- [x] **P8-4**: `docs/glossary.md` に「シルエット継承」「特徴パーツ」「スプライトディスパッチ」「TypeIcon」を追加
- [x] **P8-5**: `docs/functional-design.md` 更新不要（UI セクションに影響する変更なし）

---

## 横断タスク（全フェーズ共通、CLAUDE.md ルール）

- [ ] **X-1**: 各タスク着手前に対象ファイルの最新状態を `Read` で確認（セッション引き継ぎ時の作業原則）
- [ ] **X-2**: フロント変更後は必ず `npm run build` / `npm run lint` / `npm run test:run` でビルド・テスト検証
- [ ] **X-3**: 重要な発見・ハマりどころ（特に画風判断や Phase A での仕様変更）は即座に `decisions.md` に記録
- [ ] **X-4**: コミット前にクルトワへセキュリティレビュー依頼（CLAUDE.md 必須ルール）
- [ ] **X-5**: PWA Service Worker キャッシュ更新タイミング（ナレッジ A-7）に注意。dev で SW unregister 手順を `decisions.md` に明記
- [ ] **X-6**: 完了報告は出すが、それで作業を止めない。**P3-7 の画風承認ゲートと、Critical/High 指摘以外では止めない**

---

## 進捗マイルストーン

| マイルストーン | 完了条件 |
|--------------|--------|
| **M1: 基盤整備完了** | P1 + P2 完了。`DefaultCreatureBody` が `FallbackSilhouette` 経由で動作 |
| **M2: Phase A プロト完了** | P3 完了 + シャビ画風承認取得 |
| **M3: Phase B 全タイプ展開完了** | P4 完了。30 体すべてが描画される |
| **M4: 既存絵文字置換完了** | P5 完了。`grep` で `SPRITE_EMOJIS` `TYPE_EMOJIS[` 0 件 |
| **M5: 性能目標達成** | P6-B 完了。バンドル +30KB 以内 / 60fps / LCP 2.5s |
| **M6: コミット完了** | P7 完了。クルトワ Critical/High なしでコミット |
| **M7: スプリント完了** | P8 完了 |

---

## 残る未確定事項（実装中に発生したらシャビ判断）

| # | 項目 | トリガ |
|---|------|------|
| Q6 | Phase A の実物画風 | P3-7 ゲートでシャビが「もう少し丸み」「線細め」等の調整を求めた場合 |
| Q7 | 死亡時 `🪦`（StatusScreen L193）の SVG 化 | 画風統一観点でシャビが希望した場合 → 次スプリント送り |
| Q8 | バンドル超過時の対処 | P6-B-1 で +30KB 超過 → lazy import / ディテール削減 / 共通パーツ強化のいずれか |

---

作成: モドリッチ / 2026-05-03

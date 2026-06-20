# タスクリスト: モンスター図鑑

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |

---

## T1: 型・データ拡張

- [x] **T1-1**: `src/types/creature.ts` の GameScreen に `'zukan'` を追加
- [x] **T1-2**: `src/utils/storage.ts` の SaveData に `discoveredCreatures?: CreatureId[]` を追加
- [x] **T1-3**: `validateSaveData` で `discoveredCreatures` のバリデーション追加

## T2: CreatureSprite 拡張

- [x] **T2-1**: `src/components/CreatureSprite.tsx` に `sizeOverride?: number` / `hideShadow?: boolean` props 追加

## T3: ZukanScreen 新規作成

- [x] **T3-1**: `src/components/ZukanScreen.tsx` 新規作成
  - 全20体をステージ別グリッド表示
  - ロック/アンロック状態（シルエット vs スプライト）
  - devMode 時は全解放
  - クリックで詳細オーバーレイ表示
  - 詳細: 基本ステータス + リアクション画像6種（idle/happy/sleeping/attack/sad/hungry）

## T4: App.tsx 更新

- [x] **T4-1**: `discoveredCreatures: Set<CreatureId>` 状態を追加
- [x] **T4-2**: `handleStartGame` で `egg` を discovered に追加
- [x] **T4-3**: `handleEvolve` で進化後の creatureId を discovered に追加
- [x] **T4-4**: 卵ふ化 effect で `baby` を discovered に追加
- [x] **T4-5**: IndexedDB ロード時に `discoveredCreatures` を復元
- [x] **T4-6**: `currentSaveData` に `discoveredCreatures` を含める
- [x] **T4-7**: `handleCloudData` で `discoveredCreatures` を復元
- [x] **T4-8**: `screen === 'zukan'` で ZukanScreen をレンダリング
- [x] **T4-9**: StatusScreen と TitleScreen に `onZukan` prop を渡す

## T5: StatusScreen / TitleScreen に 図鑑ボタン追加

- [x] **T5-1**: `src/components/StatusScreen.tsx` に 図鑑ボタン追加
- [x] **T5-2**: `src/components/TitleScreen.tsx` に 図鑑ボタン追加

## T6: ビルド・テスト

- [x] **T6-1**: `npm run build` 成功
- [x] **T6-2**: `npm run test:run` 全通過

## T7: セキュリティレビュー・コミット

- [ ] **T7-1**: クルトワ（security-engineer）レビュー
- [ ] **T7-2**: コミット・PR 作成

---

作成: モドリッチ / 2026-06-20

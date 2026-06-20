# タスクリスト: ローカルセーブ読み込みの検証強化

## 背景
IndexedDB から取得した SaveData を検証せずに使用していた。クラウド経路
（`pullFromCloud`）は既に `validateSaveData()` を通しているため、ローカル経路も整合させる。
セキュリティ重大度: Low（IndexedDB はオリジン内 JS からのみ書き込み可能）。

## 方針
`loadSaveData()` 自身の中で `validateSaveData()` を実行し、検証失敗時は
`console.error` のうえ `null` を返す（クラウド経路 `pullFromCloud` と同じ挙動）。
両呼び出し箇所（App.tsx のマウント時／Continue時）は `null` を「セーブなし＝
新規作成へフォールバック」として既存ロジックで扱うため、追加変更は不要。

## タスク
- [x] `src/utils/storage.ts` の `loadSaveData()` に検証を追加
- [x] L-1 対応: `validateCreature` に必須フィールド検証を追加（lastUpdated/totalDeaths/trainCount/playCount/feedCount/evolutionName、任意 wins/losses）
- [x] テスト追加（`src/utils/__tests__/storage.test.ts`、validateSaveData/validateCreature の正常系・異常系）
- [x] `npm run test:run` 通過（272件）
- [x] `npm run build` 通過
- [x] dev サーバ実機スモーク（HTTP 200・モジュール正常トランスパイル）
- [x] クルトワ（security-engineer）レビュー → Go（Critical/High なし）

## 決定事項
- **L-1 を本スプリントに含めた**（シャビ承認）。`validateCreature` の検証漏れは
  `lastUpdated` が `cloudSave.getLocalUpdatedAt` の競合解決に直結するため。
- **範囲チェック（L-2）は意図的に見送り**。既存セーブを過剰検証で弾くリスクを避け、
  今回は型検証のみに留める。`createNewCreature` が全必須フィールドを初期化済みのため
  互換性問題なし（クルトワ確認済み）。
- 検証失敗時は `console.error` のうえ `null` 返却 → 新規作成フォールバック
  （クラウド経路 `pullFromCloud` と完全整合）。

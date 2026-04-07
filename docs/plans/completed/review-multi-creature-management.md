# 複数クリーチャー管理 実装レビュー結果

**レビュー日**: 2026-04-07  
**対象**: フェーズ1〜5 の全実装  
**修正完了日**: 2026-04-07（全 Critical / High / Medium 指摘を修正済み）

---

## レビュー担当

| 担当 | 観点 |
|------|------|
| バルベルデ（設計） | アーキテクチャ・データ整合性 |
| エンバペ（フロントエンド） | 実装品質・バグ・UI/UX |
| クルトワ（セキュリティ） | XSS・インジェクション・バリデーション |

---

## Critical

### 1. 状態管理の二重管理（バルベルデ・エンバペ共通）

`useGameState.ts`（useReducer）と `App.tsx`（useState群）が完全に並存しており、`App.tsx` は `useGameState` を一切使っていない。

- `useGameState.ts` はデッドコード。テストも旧インターフェース（`state.creature` 単数形）に向いており全件失敗状態
- `useGameState.ts` の `startGame` は `saveSaveData(toSaveData([creature], creature.id))` で既存クリーチャーを上書きする破壊的バグを内包（未使用のため顕在化していない）
- 将来の開発者がどちらを修正すべきか判断できず、保守コスト2倍

**対応方針**: `App.tsx` を正として確定し、`useGameState.ts` を削除する。テストは `App.tsx` ベースで再構築する。

---

## High

### 2. `handleContinue` でキャッチアップ後の saveSaveData 未呼び出し（バルベルデ）

`App.tsx` L141-144。`applyTimeUpdate` でキャッチアップ更新した後に `saveSaveData` が呼ばれない。コンティニュー直後にブラウザが閉じられると、古い `lastUpdated` がストレージに残り、次回ロード時に同じ時間が二重適用される可能性。

**対応方針**: `applyTimeUpdate` 後に `persistActiveCreature` 経由で保存する。

### 3. `persistActiveCreature` の activeCreatureId ハードコード（バルベルデ）

`App.tsx` L72-78。`saveSaveData` 呼び出し時に常に `updated.id` を渡しており、React state の `activeCreatureId` を参照していない。`setCreatures` のクロージャ内では `activeCreatureId` の最新値を参照できないため、競合状態で意図しない値に上書きされるリスク。

**対応方針**: `activeCreatureId` を引数として受け取る形に変更するか、`useEffect` でストレージ保存を分離する。

### 4. `handleGoToCreatureListAfterDeath` のデッドエンド（バルベルデ・エンバペ共通）

`App.tsx` L292-304。`creatures.find(c => c.isAlive && c.id !== activeCreatureId)` が見つからない場合、`return` するだけで画面が切り替わらない。ユーザーは死亡画面に取り残される。

**対応方針**: `if (!alive)` の分岐で `setScreen('title')` にフォールバックする。

### 5. インポートデータのバリデーション不足（クルトワ・バルベルデ・エンバペ共通）

`storage.ts` の `parseSaveFile` は `JSON.parse` 後に型アサーション（`as SaveData`）のみで、中身の検証なし。

- `creatures` 配列に数百万件のエントリでブラウザフリーズ（DoS）
- `hp`/`atk` 等に `Infinity`、`NaN`、負の値を注入してゲームロジック破壊
- `id` フィールドに重複値を仕込み、既存クリーチャーを上書き
- `activeCreatureId` が配列内に実在しない ID を指すケースのチェックなし

**対応方針**: `parseSaveFile` にバリデーション関数を追加。件数上限・フィールド型・数値範囲チェック。`importSave` にファイルサイズ上限（1MB）チェック。

---

## Medium

### 6. ファイルサイズ制限なし（クルトワ）

`storage.ts` の `importSave` で `file.text()` の前にサイズチェックがない。数百MBのファイルでブラウザフリーズ。

**対応方針**: `file.size > 1MB` で早期 return。

### 7. クリーチャー一覧のアクセシビリティ非対応（エンバペ）

`StatusScreen.tsx` のクリーチャー一覧で `div` にクリックハンドラを付けているが、`role="button"` / `tabIndex` / `onKeyDown` がない。キーボード操作・スクリーンリーダー不可。

**対応方針**: `button` 要素に変更するか、`role="button" tabIndex={0}` を追加。

### 8. `DeathScreen` の `Math.random()` 再レンダリング問題（エンバペ）

`DeathScreen.tsx` L46-48。雨エフェクトで `Math.random()` をJSXレンダリング中に呼んでおり、再レンダリングのたびに位置が変わりちらつく。

**対応方針**: `useMemo` で雨滴データを固定する。

### 9. `handleSelectCreature` の `setCreatures` / `setActiveCreatureId` 分離（バルベルデ）

2つの `useState` が非同期に更新されるため、ストレージには正しい値が保存されるが、React state の一時不整合が発生する可能性。

**対応方針**: 現状は実害は軽微。将来的に `useReducer` への統合で根本解決を検討。

### 10. `migrateLegacyData` の型アサーション無防備（クルトワ）

`storage.ts` L71-72。`legacy as Creature` で旧データの型整合性チェックを省略。旧データが壊れている場合、不正な構造がそのまま新フォーマットに昇格。

**対応方針**: `legacy.id` の存在確認程度の最小バリデーションを追加。

### 11. インポート後の空白画面リスク（バルベルデ）

インポートされた `SaveData` の `activeCreatureId` が `creatures` 配列に実在しない場合、`activeCreature` が null になり画面が空白になる。

**対応方針**: `handleLoadFromFile` で `activeCreatureId` の存在確認を追加。見つからなければ `creatures[0]` にフォールバック。

### 12. 破壊的操作の確認ダイアログなし（エンバペ）

`DeathScreen` の「すべてのデータを消して最初から」ボタンに確認ダイアログがない。他に生存クリーチャーがいる状態で誤タップすると全データ消失。

**対応方針**: `window.confirm` または確認モーダルを挟む。

---

## Low

### 13. エクスポート/インポートのエラーフィードバック不足（エンバペ）

失敗しても `console.error` のみ。ユーザーに通知されない。

### 14. `activeCreature!` の非nullアサーション（エンバペ）

`App.tsx` L164。`handleDrawingComplete` / `handleDrawingSkip` で `activeCreature!` を使用。条件レンダリングが守っているが防御的でない。

### 15. `battleRoomCode` が常に空文字列（エンバペ）

`App.tsx` L45。セッター不使用。定数で良い。

### 16. エクスポートファイルのバージョンチェック未実装（クルトワ）

`parseSaveFile` で `version` の範囲チェックがない。将来バージョン増加時に誤パースのリスク。

### 17. コンソールへのエラー詳細出力（クルトワ）

`storage.ts` 全般。本番PWAではエラーを汎用メッセージに差し替え推奨。

---

## 対応優先度まとめ

| 優先度 | 件数 | 対応方針 |
|--------|------|---------|
| Critical | 1件 | `useGameState.ts` を削除し二重管理を解消 |
| High | 4件 | データ整合性・デッドエンド・バリデーション — 次の実装前に対処 |
| Medium | 7件 | a11y・UI品質・エッジケース — 順次対応 |
| Low | 5件 | 改善提案 — 余裕があれば対応 |

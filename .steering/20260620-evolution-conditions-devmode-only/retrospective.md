# 振り返り: 進化条件の表示を devモード × 設定画面のみに制限

- 日付: 2026-06-20
- ブランチ: `chore/evolution-conditions-devmode-only`

## 背景・要望
シャビより「進化条件の表示を devモードのみ、また表示するのは設定画面（ステータス画面）の
ときのみにして」。通常プレイヤーには進化条件を見せず、開発時にステータス画面でのみ確認したい。

## 変更内容
- `src/components/ActionButtons.tsx`: メイン画面に出していた進化条件チップの表示ブロックを撤去。
  併せて未使用となる `getEvolutionProgress` import と `evolutionProgress` 変数を削除。
  （「進化できる！タップして進化！」ボタンは進化アクションなので残置）
- `src/components/StatusScreen.tsx`: 進化条件ブロックの表示条件を
  `creature.evolutionStage < 5` → `devMode && creature.evolutionStage < 5` に変更。
  `devMode?: boolean` prop を追加（未渡し時は falsy で非表示＝安全側デフォルト）。
  なお「進化系統（系統図）」は条件ではないため常時表示のまま。
- `src/App.tsx`: `StatusScreen` に `devMode={devMode}` を渡す。

## 設計判断
- 「設定画面のときのみ」= 進化条件はステータス画面に集約し、メイン画面からは撤去。
- 「devモードのみ」= ステータス画面でも devMode のときだけ表示。
- これは表示制御のみで、進化条件の数値・判定ロジック（`evolution.ts` / `gameLogic.ts`）は不変。

## セキュリティレビュー（クルトワ）
- Critical/High/Medium ゼロ。XSS・インジェクション・ハードコーディング指摘なし。
- 補足: `devMode` は UI 状態でありセキュリティ境界ではない（進化条件の数値はバンドルJSから読める）。
  今回の意図（通常プレイヤーに見せない）には十分。

## 検証
- `npx tsc --noEmit` パス。
- プレビューで確認:
  - メイン画面: 進化条件 非表示
  - ステータス画面（devMode OFF）: 進化条件 非表示
  - ステータス画面（devMode ON）: 進化条件 表示
  - コンソールエラーなし。

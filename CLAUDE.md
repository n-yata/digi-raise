# CLAUDE.md — digi-raise

ゲームの詳細仕様は [`docs/spec.md`](docs/spec.md) を参照してください。

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイする。

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)
```

## 実装上の注意

- `src/types/creature.ts` と `src/hooks/useGameState.ts` の両方に `GameState` インターフェースが存在する。hooks 側が実際の状態管理に使われている。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま、表示のみ `Math.floor`。
- ごはんアクションは EXP を付与しない。
- devMode は `App.tsx` のヘッダー「DEV」ボタンで切り替え。時間スケール: 30分 → 30秒。

# currentDate
Today's date is 2026-04-04.

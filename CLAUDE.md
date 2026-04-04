# CLAUDE.md — digi-raise

仕様書は以下を参照:
- フロントエンド仕様: [`docs/specifications/spec-frontend.md`](docs/specifications/spec-frontend.md)
- バックエンド仕様: [`docs/specifications/spec-backend.md`](docs/specifications/spec-backend.md)

## ディレクトリ構成

```
digi-raise/
├── frontend/          # フロントエンド一式（React + Vite）
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/           # バックエンド一式（AWS Lambda + Terraform）
│   ├── lambda/        # Lambda 関数（Node.js ESModules）
│   └── terraform/     # AWSリソース IaC
├── docs/              # 仕様書・設計ドキュメント
├── .github/           # GitHub Actions ワークフロー
└── CLAUDE.md
```

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイする。

## 開発コマンド

`frontend/` ディレクトリ内で実行するか、ルートから `--prefix frontend` を付けて実行する。

```bash
# frontend/ ディレクトリ内で実行
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)

# ルートから実行する場合
npm run dev --prefix frontend
npm run build --prefix frontend
```

## 仕様書の更新ルール

実装が完了したら、`docs/specifications/` の仕様書も併せて最新化すること。

## 実装上の注意

- `frontend/src/types/creature.ts` と `frontend/src/hooks/useGameState.ts` の両方に `GameState` インターフェースが存在する。hooks 側が実際の状態管理に使われている。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま、表示のみ `Math.floor`。
- ごはんアクションは EXP を付与しない。
- devMode は `App.tsx` のヘッダー「DEV」ボタンで切り替え。時間スケール: 30分 → 30秒。
- バトルロジック（ダメージ計算・ターン解決）はフロントエンドで完結。サーバーは乱数シードの発行と同期のみ担う。
- タイプ相性マトリクスは `frontend/src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` が正。有利: ×1.2、不利: ×0.8。
- WebSocket 接続には `VITE_WS_URL` と `VITE_WS_SECRET_KEY` 環境変数が必要（`frontend/.env.example` 参照）。

# currentDate
Today's date is 2026-04-04.

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
│   ├── terraform/     # AWSリソース IaC
│   ├── events/        # sam local invoke 用サンプルイベント
│   ├── template.yaml  # SAM テンプレート
│   ├── samconfig.toml # SAM CLI デフォルト設定
│   ├── env.json       # ローカル開発用環境変数
│   └── docker-compose.yml  # DynamoDB Local
├── docs/              # 仕様書・設計ドキュメント
├── .github/           # GitHub Actions ワークフロー
└── CLAUDE.md
```

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイする。

## 開発コマンド

### フロントエンド

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

### バックエンド（SAM ローカル開発）

**制約**: `sam local start-api` は WebSocket API 非対応。`sam local invoke` で個別 Lambda を実行する。

```bash
# backend/ ディレクトリ内で実行

# 1. DynamoDB Local を起動（初回のみテーブル自動作成）
docker compose up -d

# 2. SAM ビルド（Lambda コードをパッケージング）
sam build

# 3. 各 Lambda 関数をローカル実行
#    connect: $connect ルート（事前に events/gen-token.mjs でトークン生成が必要）
node events/gen-token.mjs   # token と ts を確認して events/connect.json に設定
sam local invoke ConnectFunction -e events/connect.json --docker-network backend_default

#    disconnect: $disconnect ルート
sam local invoke DisconnectFunction -e events/disconnect.json --docker-network backend_default

#    message: ping アクション
sam local invoke MessageFunction -e events/message-ping.json --docker-network backend_default

#    message: create_room アクション
sam local invoke MessageFunction -e events/message-create-room.json --docker-network backend_default

#    emergency-shutdown
sam local invoke EmergencyShutdownFunction

# 4. DynamoDB Local のデータを確認
aws dynamodb scan --table-name DigiRaiseConnections \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1 \
  --no-sign-request

# DynamoDB Local を停止
docker compose down
```

**`env.json` について**: `backend/env.json` にローカル用の環境変数を定義。`DYNAMODB_ENDPOINT` で DynamoDB Local に接続する。`samconfig.toml` に `env_vars = "env.json"` を設定済みのため `--env-vars` オプション省略可能。

**トークン生成**: `connect` 関数は HMAC-SHA256 認証を行うため、テスト前に `node events/gen-token.mjs` でトークンを生成し `events/connect.json` の `token` と `ts` を更新すること（有効期限 ±60秒）。

## 仕様書の更新ルール

実装が完了したら、`docs/specifications/` の仕様書も併せて最新化すること。

## ゲームデザイン決定時の原則

以下のようなゲームデザインに関わる判断が発生した場合、**チームに実装を割り振る前に必ずシャビに確認すること**。

- 新しい進化系統・ステージの追加（進化条件の数値含む）
- EXP、ステータス成長値、アクション効果量の変更
- バトルのダメージ計算式・タイプ相性係数の変更
- 特殊アクション（special）の効果内容の追加・変更
- 新しいアクション・ゲームメカニクスの追加
- バランスに影響する時間更新サイクルの変更

ゲームデザイン上の意思決定は `docs/game-design.md` に記録すること。
未決定事項は同ファイルの「未決定事項」セクションに追記し、シャビの判断を待つこと。

## 実装上の注意

- `GameState` 型は `frontend/src/types/creature.ts` に定義。`creatures: Creature[]` + `activeCreatureId: string | null` で複数クリーチャーを管理する。
- 状態管理の中枢は `App.tsx`（useState群）。`useGameState.ts` は削除済み。
- クリーチャーの保存は `SaveData { creatures, activeCreatureId }` を固定キー `"saveData"` で IndexedDB に一括保存（`storage.ts`）。
- 非アクティブのクリーチャーは時間停止。切り替え時に `lastUpdated` を現在時刻にリセットする。
- 死亡クリーチャーは `isAlive: false` の状態でリストに墓石として残る。個別削除も可能。
- クリーチャーの保持上限は5体（`MAX_CREATURES = 5`、死亡含む）。上限時は新規作成ボタンを無効化。アクティブクリーチャーは削除不可。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま、表示のみ `Math.floor`。
- ごはんアクションは EXP を付与しない。
- devMode は `App.tsx` のヘッダー「DEV」ボタンで切り替え。時間スケール: 30分 → 30秒。
- バトルロジック（ダメージ計算・ターン解決）はフロントエンドで完結。サーバーは乱数シードの発行と同期のみ担う。バトルはアクティブクリーチャーで自動参加。
- タイプ相性マトリクスは `frontend/src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` が正。有利: ×1.2、不利: ×0.8。
- WebSocket 接続には `VITE_WS_URL` と `VITE_WS_SECRET_KEY` 環境変数が必要（`frontend/.env.example` 参照）。

# currentDate
Today's date is 2026-04-04.

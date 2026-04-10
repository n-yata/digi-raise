# CLAUDE.md — digi-raise

仕様書は以下を参照:
- フロントエンド仕様: [`docs/specifications/spec-frontend.md`](docs/specifications/spec-frontend.md)
- バトル機能実装計画: [`docs/plans/battle-feature.md`](docs/plans/battle-feature.md)

## ディレクトリ構成

```
digi-raise/
├── frontend/              # フロントエンド（React + TypeScript + Vite）
│   ├── src/
│   │   ├── components/    # React コンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   ├── types/         # 型定義
│   │   ├── utils/         # ユーティリティ
│   │   ├── data/          # 静的データ
│   │   ├── main.tsx       # エントリーポイント
│   │   └── index.css      # グローバルスタイル
│   ├── public/            # 静的アセット
│   ├── index.html         # エントリー HTML
│   ├── package.json       # 依存関係・スクリプト
│   ├── vite.config.ts     # Vite 設定
│   ├── tsconfig.json      # TypeScript 設定
│   └── tailwind.config.js # Tailwind CSS 設定
├── backend/               # バックエンド（Go / AWS Lambda + SAM）
│   ├── cmd/               # Lambda エントリーポイント
│   │   ├── connect/       # $connect ルート（認証・再接続）
│   │   ├── disconnect/    # $disconnect ルート（切断処理）
│   │   ├── message/       # $default ルート（全メッセージ処理）
│   │   └── emergency-shutdown/  # 緊急遮断（SNS トリガー）
│   ├── internal/
│   │   ├── handler/       # Lambda ハンドラ本体
│   │   ├── battle/        # バトルルーム操作ロジック
│   │   ├── db/            # DynamoDB テーブル操作
│   │   ├── apigw/         # API Gateway PostToConnection ラッパー
│   │   └── auth/          # HMAC トークン検証
│   ├── infra/             # SAM テンプレート・デプロイ設定
│   ├── Makefile           # ビルド・デプロイ
│   ├── go.mod
│   └── go.sum
├── docs/                  # 仕様書・設計ドキュメント
├── .github/               # GitHub Actions ワークフロー
└── CLAUDE.md
```

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
- **フロントエンド**: React + TypeScript + Vite → GitHub Pages にデプロイ
- **バックエンド**: Go + AWS Lambda + API Gateway WebSocket API → SAM でデプロイ
- **バトル**: CPU戦（フロントエンド完結）+ オンラインバトル（WebSocket 経由）
- **ダメージ計算**: フロントエンドで実行。サーバーは乱数シード配信・ターン管理・マッチングを担当

## 開発コマンド

### フロントエンド（`frontend/` ディレクトリで実行）

```bash
cd frontend
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)
npm run test:run # テスト実行
```

### バックエンド（`backend/` ディレクトリで実行）

```bash
cd backend
make build       # 全 Lambda をクロスコンパイル (Linux/amd64)
make test        # Go テスト実行
make deploy      # sam deploy（samconfig.toml 使用）
make clean       # dist/ 削除
```

手動デプロイ（Windows Git Bash）:
```bash
MSYS_NO_PATHCONV=1 sam.cmd deploy \
  --template-file infra/template.yaml \
  --stack-name digi-raise-battle \
  --resolve-s3 --s3-prefix digi-raise-battle \
  --region ap-northeast-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides "AlertEmail=<メールアドレス>" \
  --no-confirm-changeset
```

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
- 状態管理の中枢は `frontend/src/App.tsx`（useState群）。`useGameState.ts` は削除済み。
- クリーチャーの保存は `SaveData { creatures, activeCreatureId }` を固定キー `"saveData"` で IndexedDB に一括保存（`storage.ts`）。
- 非アクティブのクリーチャーは時間停止。切り替え時に `lastUpdated` を現在時刻にリセットする。
- 死亡クリーチャーは `isAlive: false` の状態でリストに墓石として残る。個別削除も可能。
- クリーチャーの保持上限は5体（`MAX_CREATURES = 5`、死亡含む）。上限時は新規作成ボタンを無効化。アクティブクリーチャーは削除不可。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま、表示のみ `Math.floor`。
- ごはんアクションは EXP を付与しない。
- devMode は `App.tsx` のヘッダー「DEV」ボタンで切り替え。時間スケール: 30分 → 30秒。
- バトルロジック（ダメージ計算・ターン解決）はフロントエンドで完結。バトルはアクティブクリーチャーで自動参加。
- QRバトル: 相手クリーチャーデータをQRコード経由で取得し、CPU AIで相手アクションを自動選択してローカルバトル。
- タイプ相性マトリクスは `frontend/src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` が正。有利: ×1.2、不利: ×0.8。

## バックエンド（WebSocket バトル）

### アーキテクチャ

```
GitHub Pages (PWA) ←→ API Gateway WebSocket API ←→ Lambda (Go) ←→ DynamoDB
```

- **WebSocket エンドポイント**: `wss://<REDACTED>.execute-api.ap-northeast-1.amazonaws.com/prod`
- **ランタイム**: provided.al2023（Go カスタムランタイム）
- **IaC**: AWS SAM（`backend/infra/template.yaml`）

### Lambda 関数

| 関数 | ルート | 役割 |
|------|--------|------|
| connect | $connect | HMAC 認証、メンテナンスチェック、再接続処理 |
| disconnect | $disconnect | ルームクリーンアップ、再接続猶予（60秒） |
| message | $default | メッセージルーティング、レート制限、バトルロジック |
| emergency-shutdown | SNS | 異常検知時にメンテナンスモード有効化 |

### DynamoDB テーブル

| テーブル | PK | 用途 |
|---------|-----|------|
| DigiRaiseConnections | connectionId | WebSocket 接続管理（TTL: 1時間） |
| DigiRaiseRooms | roomCode | ルーム・バトル状態管理（TTL: 2時間） |
| DigiRaiseConfig | configKey | メンテナンスモード等の設定 |

### メッセージフロー

1. `create_room` → 6桁ルームコード生成 → `room_created` 返却
2. `join_room` → ルーム参加 → 双方に `opponent_joined`
3. `ready` → 両者 ready → `battle_start`（seed + role）
4. `select_action` → 両者選択完了 → `actions_locked`（両アクション + seed）
5. フロントエンドでダメージ計算・HP更新

### セキュリティ

- HMAC-SHA256 トークン検証（`$connect` 時、±60秒有効）
- メッセージレート制限（60msg 超過で 429）
- アクション二重送信防止（DynamoDB 条件式）
- 再接続トークン: `crypto/rand` 16バイト、60秒有効期限 + race condition 対策
- 自動遮断: CloudWatch Alarm → SNS → emergency-shutdown Lambda → メンテナンスモード

### 運用コマンド

```bash
# メンテナンスモード解除
MSYS_NO_PATHCONV=1 aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"false"}}' \
  --region ap-northeast-1

# メンテナンスモード手動有効化
MSYS_NO_PATHCONV=1 aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"true"}}' \
  --region ap-northeast-1

# CloudWatch ログ確認
aws logs tail /aws/lambda/digi-raise-battle-message --region ap-northeast-1 --follow
```

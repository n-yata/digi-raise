# CLAUDE.md — digi-raise

仕様書は以下を参照:
- フロントエンド仕様: [`docs/specifications/spec-frontend.md`](docs/specifications/spec-frontend.md)
- バックエンド仕様: [`docs/specifications/spec-backend.md`](docs/specifications/spec-backend.md)
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

Windows Git Bash では AWS CLI / SAM CLI 実行時にパスが変換される問題がある:
```bash
# NG: /digi-raise/... が C:/Program Files/Git/... に変換される
aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...

# OK: MSYS_NO_PATHCONV=1 を付ける
MSYS_NO_PATHCONV=1 aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...

# SAM CLI は sam.cmd を使う（sam コマンドは Git Bash で見つからない）
MSYS_NO_PATHCONV=1 sam.cmd deploy ...
```

デプロイ・運用の詳細コマンドは [`docs/specifications/spec-backend.md`](docs/specifications/spec-backend.md) を参照。

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

詳細は [`docs/specifications/spec-backend.md`](docs/specifications/spec-backend.md) を参照。

- **WebSocket エンドポイント**: `frontend/.env` の `VITE_WS_ENDPOINT` に設定（SAM deploy の Outputs で確認）
- **IaC**: AWS SAM（`backend/infra/template.yaml`）
- Lambda 4つ: connect / disconnect / message / emergency-shutdown
- DynamoDB 3テーブル: Connections / Rooms / Config
- ダメージ計算はフロントエンド実行。サーバーは乱数シード配信・ターン管理・マッチングを担当
- creature データは `json.RawMessage`（DynamoDB Binary 型）でそのまま保存・転送。サーバーは中身を解釈しない（スキーマ変更に強い）
- API Gateway WebSocket メッセージサイズ上限: クライアント→サーバー 32KB / サーバー→クライアント 128KB
- Lambda 同時実行数のアカウント上限は 50（ReservedConcurrentExecutions は設定不可）
- `frontend/.env` に `VITE_WS_ENDPOINT` と `VITE_WS_SECRET_KEY` を設定。GitHub Actions では Secrets から注入（`deploy.yml` の `env` セクション）

## 開発時の注意

詳細は [`docs/knowledge/`](docs/knowledge/) を参照。

- **PWA キャッシュ**: コード変更がブラウザに反映されない場合、DevTools → Application → Service Workers → Unregister → Clear site data → リロード
- **バグ調査の順序**: 表示コンポーネント（最下流）から逆順に辿る。上流（バックエンド）から調べると遠回りになりやすい
- **URL/シークレットのハードコード禁止**: 環境変数（`VITE_*` / `os.Getenv`）経由で取得。`.env` + `.gitignore` で管理。フォールバック値もソースに含めない

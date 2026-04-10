# デジレイズ / DigiRaise

デジモン風の育成ゲーム PWA です。クリーチャーを育て、進化させ、バトルしましょう。

詳細な仕様は [`docs/specifications/`](docs/specifications/) を参照してください。

## 遊び方

1. タイトル画面でクリーチャーの名前とタイプを選択
2. タマゴをタップして孵化させる
3. えさ・トレーニング・あそぶ・ねるで世話をする
4. 条件を満たすと進化する（最終的にアルティメットを目指せ）
5. 放置しすぎると死んでしまう……
6. オンラインバトルで他のプレイヤーと対戦！

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + TypeScript + Vite + Tailwind CSS |
| ホスティング | GitHub Pages (PWA) |
| バックエンド | Go + AWS Lambda (provided.al2023) |
| リアルタイム通信 | AWS API Gateway WebSocket API |
| データベース | Amazon DynamoDB |
| IaC | AWS SAM |
| CI/CD | GitHub Actions |

## 開発

### フロントエンド

```bash
cd frontend
npm install
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # プロダクションビルド
npm run preview  # ビルド結果の確認
npm run lint     # Lint チェック
```

> **Dev Container 環境の場合**: ブラウザからアクセスするには `--host` オプションを付けて起動してください（Dev Container 内でのみ使用してください）。
> ```bash
> npm run dev -- --host
> ```
> VS Code の「ポート」タブに表示される 5173 ポートからブラウザで開けます。

### バックエンド（`backend/` ディレクトリで実行）

前提条件: Go 1.24+, [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), AWS CLI

```bash
cd backend
make build       # 全 Lambda をクロスコンパイル (GOOS=linux GOARCH=amd64)
make test        # Go テスト実行
make clean       # ビルド成果物を削除
```

## デプロイ

### フロントエンド

GitHub Pages でホスティング。`main` ブランチへの push で GitHub Actions が自動デプロイ。

公開 URL: `https://<username>.github.io/digi-raise/`

### バックエンド

AWS SAM でデプロイ。詳細は [`docs/specifications/spec-backend.md`](docs/specifications/spec-backend.md) を参照。

```bash
cd backend
make build && sam.cmd deploy --template-file infra/template.yaml ...
```

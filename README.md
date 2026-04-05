# デジレイズ / DigiRaise

デジモン風の育成ゲーム PWA です。クリーチャーを育て、進化させましょう。

詳細な仕様は [`docs/specifications/`](docs/specifications/) を参照してください。

## 遊び方

1. タイトル画面でクリーチャーの名前とタイプを選択
2. タマゴをタップして孵化させる
3. えさ・トレーニング・あそぶ・ねるで世話をする
4. 条件を満たすと進化する（最終的にアルティメットを目指せ）
5. 放置しすぎると死んでしまう……

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

### バックエンド（SAM ローカル開発）

前提条件: [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)、Docker

> **注意**: WebSocket API は `sam local start-api` 非対応のため、`sam local invoke` で各 Lambda を個別に実行します。

```bash
cd backend

# 1. env.json を作成（初回のみ）
cp env.json.example env.json
# env.json の SECRET_KEY を任意の値に変更

# 2. DynamoDB Local を起動（テーブルも自動作成される）
docker compose up -d

# 3. SAM ビルド
sam build

# 4. 各 Lambda を実行
#    connect ルートのテスト（事前にトークン生成が必要）
node events/gen-token.mjs   # 出力値を events/connect.json の token/ts に設定
sam local invoke ConnectFunction -e events/connect.json --docker-network backend_default

#    disconnect ルートのテスト
sam local invoke DisconnectFunction -e events/disconnect.json --docker-network backend_default

#    message ルートのテスト（ping）
sam local invoke MessageFunction -e events/message-ping.json --docker-network backend_default

#    message ルートのテスト（ルーム作成）
sam local invoke MessageFunction -e events/message-create-room.json --docker-network backend_default

# 5. DynamoDB Local のデータ確認
aws dynamodb scan --table-name DigiRaiseConnections \
  --endpoint-url http://localhost:8000 \
  --region ap-northeast-1 \
  --no-sign-request

# DynamoDB Local を停止
docker compose down
```

## デプロイ

GitHub Pages でホスティング。ビルド後 `dist/` を `gh-pages` ブランチへプッシュします。

公開 URL: `https://<username>.github.io/digi-raise/`

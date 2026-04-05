# ローカル開発 ナレッジ

SAM + DynamoDB Local でローカル開発する際に判明した落とし穴と解決策。

---

## SAM local で `!Ref` がテーブル名に解決されない

### 現象

`template.yaml` で環境変数に `!Ref` を使うと、SAM local 実行時に DynamoDB テーブル名ではなく **CloudFormation 論理 ID** が渡される。

```yaml
# NG: SAM local では "ConnectionsTable" という文字列が渡される
CONNECTIONS_TABLE: !Ref ConnectionsTable

# OK: 実際のテーブル名を直書きする
CONNECTIONS_TABLE: DigiRaiseConnections
```

### 原因

SAM local は CloudFormation の `!Ref` をリソースの論理 ID で解決する（実際の `TableName` プロパティを見ない）。本番デプロイ時は正しく解決されるが、ローカル実行時は不一致になる。

### 対処

Lambda 環境変数のテーブル名はリテラル文字列で直書きする。テーブル名が固定値であれば実害はない。

---

## SAM local の `--env-vars` が Windows で機能しない

### 現象

`sam local invoke --env-vars env.json` を実行しても、`env.json` に書いた環境変数が Lambda コンテナに渡されない。

### 原因

Windows 環境の SAM CLI が `env.json` を読む際にエンコーディング問題などで無視することがある。`samconfig.toml` の `env_vars` 設定も同様に効かない場合がある。

### 対処

環境変数の注入は `--env-vars` に依存せず、以下の方法で対応する。

1. **DynamoDB エンドポイント**: `AWS_SAM_LOCAL=true`（SAM が自動注入）で検知してコード内でハードコード
2. **テーブル名**: `template.yaml` 環境変数にリテラル文字列で直書き
3. **シークレットキー**: `template.yaml` の `Parameters` デフォルト値を使用

---

## DynamoDB Local へのネットワーク接続

### 構成

```
[SAM Lambda コンテナ] ---> [digi-raise-dynamodb-local:8000]
        |                           |
        +--- backend_default -------+  (Docker network)
```

### ポイント

- `host.docker.internal:8000` 経由では Lambda コンテナから DynamoDB Local のテーブルが見えない場合がある（Windows + Docker Desktop の制約）
- `--docker-network backend_default` でコンテナ名 `digi-raise-dynamodb-local` で直接通信するのが確実
- DynamoDB Local はセットアップコンテナが `local/local` 認証情報で作成するため、Lambda 側も同じ認証情報を使う必要がある

### `dynamodb.mjs` の実装

```js
const isLocal = process.env.AWS_SAM_LOCAL === 'true';
const endpoint =
  process.env.DYNAMODB_ENDPOINT ||
  (isLocal ? 'http://digi-raise-dynamodb-local:8000' : undefined);

client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  ...(endpoint && { endpoint }),
  ...(isLocal && {
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  }),
});
```

---

## SAM local invoke の正しいコマンド

```bash
# DynamoDB Local を先に起動
docker compose up -d

# SAM ビルド
sam build

# connect テスト（トークン生成 → 即 invoke、60秒以内）
node events/gen-token.mjs
sam local invoke ConnectFunction -e events/connect.json --docker-network backend_default

# その他
sam local invoke MessageFunction -e events/message-ping.json --docker-network backend_default
sam local invoke DisconnectFunction -e events/disconnect.json --docker-network backend_default
```

`--docker-network backend_default` は必須。これがないと Lambda から DynamoDB Local に接続できない。

# AWS デプロイ ナレッジ

バックエンドの AWS デプロイで判明した落とし穴と知見。

---

## Lambda ReservedConcurrentExecutions はアカウント上限に依存する

### 現象

SAM テンプレートで `ReservedConcurrentExecutions: 5` を設定したところ、デプロイが失敗。

```
Specified ReservedConcurrentExecutions for function decreases account's
UnreservedConcurrentExecution below its minimum value of [50].
```

### 原因

新しい AWS アカウントの Lambda 同時実行数上限はデフォルトで **50**（以前は 1,000）。
UnreservedConcurrentExecutions は最低 50 を維持する必要があるため、上限 50 のアカウントでは ReservedConcurrentExecutions を 1 でも設定できない。

### 確認方法

```bash
aws lambda get-account-settings --region ap-northeast-1 \
  --query '{ConcurrentExecutions: AccountLimit.ConcurrentExecutions}'
```

### 対処

- ReservedConcurrentExecutions は断念
- 代わりに API Gateway スロットリングと CloudWatch Alarm で制御
- 上限 50 自体がコスト防御として機能する（同時 50 以上は動かない）
- 必要に応じて AWS サポートにクォータ引き上げをリクエスト

---

## Windows Git Bash で AWS CLI のパスが変換される

### 現象

```bash
aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...
```

が以下のように変換されてしまう:

```
arn:aws:ssm:...:parameter/C:/Program Files/Git/digi-raise/hmac-secret-key
```

### 原因

Git Bash (MSYS2) がスラッシュで始まる引数を Windows パスに自動変換する。

### 対処

```bash
MSYS_NO_PATHCONV=1 aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...
```

`MSYS_NO_PATHCONV=1` を先頭に付けることでパス変換を無効化。
SAM CLI も同様に `MSYS_NO_PATHCONV=1 sam.cmd deploy ...` とする。

---

## SAM CLI は Windows で `sam.cmd` を使う

### 現象

```bash
sam --version
# /usr/bin/bash: line 1: sam: command not found
```

### 原因

Windows にインストールされた SAM CLI は `sam.cmd` として登録される。Git Bash からは `.cmd` 拡張子を明示する必要がある。

### 対処

```bash
sam.cmd --version     # OK
sam.cmd deploy ...    # OK
```

Makefile の `sam` コマンドは Linux/macOS 向けなので、Windows では直接 `sam.cmd` を使う。

---

## AWS::ApiGatewayV2::RouteSettings はリソースタイプとして存在しない

### 現象

SAM テンプレートで以下を定義するとデプロイエラー。

```yaml
ConnectRouteSettings:
  Type: AWS::ApiGatewayV2::RouteSettings   # ← 存在しない
```

### 対処

`$connect` ルートのスロットリングは Stage リソースの `RouteSettings` プロパティ内で設定する。

```yaml
WebSocketStage:
  Type: AWS::ApiGatewayV2::Stage
  Properties:
    DefaultRouteSettings:
      ThrottlingRateLimit: 20
      ThrottlingBurstLimit: 50
    RouteSettings:
      $connect:
        ThrottlingRateLimit: 2
        ThrottlingBurstLimit: 5
```

---

## IAMFullAccess は実質 AdministratorAccess と同等

### 現象

`dev_user` に `IAMFullAccess` が付与されていたため、自分自身に任意のポリシーを追加できた。

### リスク

`iam:AttachUserPolicy` 権限があると、自分に `AdministratorAccess` を付けて事実上何でもできる状態になる。

### 対処

- `IAMFullAccess` を削除し、SAM デプロイに必要な最小限の IAM 権限をカスタムポリシーで付与
- カスタムポリシーの Resource を `arn:aws:iam::*:role/digi-raise-battle-*` に限定
- IAM ユーザーのポリシー上限は 10 個（AWS のクォータ）

---

## GitHub Actions で Vite 環境変数を注入する方法

### 背景

Vite の `VITE_*` 環境変数はビルド時にバンドルに埋め込まれる。GitHub Actions でビルドする場合、Secrets から注入が必要。

### 設定

1. GitHub リポジトリ → Settings → Secrets → Actions に値を登録
2. deploy.yml の Build ステップに `env` を追加

```yaml
- name: Build
  run: npm run build
  working-directory: frontend
  env:
    VITE_WS_ENDPOINT: ${{ secrets.VITE_WS_ENDPOINT }}
    VITE_WS_SECRET_KEY: ${{ secrets.VITE_WS_SECRET_KEY }}
```

### gh CLI でも設定可能

```bash
gh secret set VITE_WS_ENDPOINT --repo owner/repo --body "wss://..."
```

---

## git filter-repo でシークレットを履歴から削除する方法

### 手順

1. 置換ルールファイルを作成:

```
secret-value==>REDACTED
```

2. 実行:

```bash
git filter-repo --replace-text replacements.txt --force
```

3. origin が削除されるので再設定:

```bash
git remote add origin https://github.com/owner/repo.git
```

4. force push:

```bash
git push --force origin main
```

### 注意

- `git filter-repo` は origin remote を自動削除する
- 全コミット履歴が書き換えられるので、他の開発者がいる場合は事前に合意が必要
- 書き換え後は全員が `git fetch --all && git reset --hard origin/main` する必要がある

---

## json.RawMessage は DynamoDB で Binary (B) 型として保存される

### 背景

Go の `json.RawMessage` は `[]byte` のエイリアス。`attributevalue.MarshalMap` を使うと DynamoDB の Binary (B) 型として保存される。

### メリット

- サーバー側でクリーチャーデータの構造を知る必要がない
- フロントエンドが送った JSON をそのまま保存・転送できる
- スキーマ変更に強い（フロントエンド側だけ変更すれば良い）

### 注意

- `UnmarshalMap` 時も `[]byte` として戻り、`json.RawMessage` に自動代入される
- SendJSON で `json.Marshal` する際も正しく JSON として埋め込まれる

---

## API Gateway WebSocket のメッセージサイズ上限

| 方向 | 上限 |
|------|------|
| クライアント → サーバー | 32 KB |
| サーバー → クライアント | 128 KB |

カスタムスプライト（SVG）を含むクリーチャーデータを送信する際は、現在のステージ分のみに絞ってデータ量を抑える。

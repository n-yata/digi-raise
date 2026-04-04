# デジレイズ バックエンド仕様書

**作成日**: 2026-04-04
**対象**: digi-raise バトル機能 バックエンド

---

## 1. 概要

デジレイズのバトル機能はサーバーレスアーキテクチャで実装する。
フロントエンドは GitHub Pages にホストされ、バックエンドは AWS 上の WebSocket API を通じてリアルタイム通信を行う。

---

## 2. AWSリソース構成

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Pages (フロントエンド)                           │
│  React PWA                                               │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket (wss://)
┌────────────────────▼────────────────────────────────────┐
│  API Gateway WebSocket API                               │
│  digi-raise-battle-ws                                    │
│  ├── $connect    → Lambda: digi-raise-connect            │
│  ├── $disconnect → Lambda: digi-raise-disconnect         │
│  └── $default    → Lambda: digi-raise-message            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  DynamoDB                                                │
│  ├── DigiRaiseConnections (接続情報)                     │
│  ├── DigiRaiseRooms       (ルーム・バトル状態)           │
│  └── DigiRaiseConfig      (設定値・メンテナンス制御)     │
└─────────────────────────────────────────────────────────┘
```

### AWSリソース一覧

| リソース | 名称 | 設定 |
|---------|------|------|
| API Gateway | digi-raise-battle-ws | WebSocket API, prod ステージ |
| Lambda | digi-raise-connect | $connect ルート, Node.js 22.x |
| Lambda | digi-raise-disconnect | $disconnect ルート, Node.js 22.x |
| Lambda | digi-raise-message | $default ルート, Node.js 22.x |
| Lambda | digi-raise-emergency-shutdown | 緊急遮断用, Node.js 22.x |
| DynamoDB | DigiRaiseConnections | PAY_PER_REQUEST, TTL有効 |
| DynamoDB | DigiRaiseRooms | PAY_PER_REQUEST, TTL有効 |
| DynamoDB | DigiRaiseConfig | PAY_PER_REQUEST |
| IAM Role | digi-raise-lambda-role | Lambda実行ロール |
| SNS Topic | digi-raise-alert | 緊急通知 |
| CloudWatch Alarm | digi-raise-connection-spike | 接続数 > 500 |
| CloudWatch Alarm | digi-raise-lambda-spike | Lambda実行 > 10,000回/時間 |

---

## 3. ディレクトリ構成

```
backend/
├── lambda/
│   ├── package.json                  # type: "module", AWS SDK v3 依存
│   ├── shared/
│   │   ├── dynamodb.mjs              # DynamoDB DocumentClient シングルトン
│   │   └── apigw.mjs                 # postToConnection ヘルパー
│   ├── connect/
│   │   └── index.mjs                 # $connect ルートハンドラー
│   ├── disconnect/
│   │   └── index.mjs                 # $disconnect ルートハンドラー
│   ├── message/
│   │   └── index.mjs                 # $default ルートハンドラー
│   └── emergency-shutdown/
│       └── index.mjs                 # 緊急遮断ハンドラー
└── terraform/
    ├── main.tf                       # provider設定 (AWS ~>5.0, Terraform >=1.5)
    ├── variables.tf                  # secret_key (sensitive), alert_email, aws_region
    ├── dynamodb.tf                   # DynamoDBテーブル3つ + 初期レコード
    ├── iam.tf                        # IAM Role + インラインポリシー
    ├── lambda.tf                     # Lambda関数4つ + archive_file
    ├── apigateway.tf                 # WebSocket API + ルート + Lambda permission
    ├── monitoring.tf                 # CloudWatch Alarm + SNS + Log Group
    └── outputs.tf                    # websocket_url 等7出力
```

---

## 4. DynamoDBテーブル設計

### DigiRaiseConnections

WebSocket 接続ごとのセッション管理。

| 属性 | 型 | 説明 |
|------|-----|------|
| connectionId | String (PK) | API Gateway が割り当てる接続ID |
| roomCode | String | 参加中のルームコード（未参加時は属性なし） |
| connectedAt | Number | 接続タイムスタンプ（Unix秒） |
| lastPingAt | Number | 最終アクティブタイムスタンプ（Unix秒） |
| messageCount | Number | 送信メッセージ数（レート制限用、60秒ウィンドウ） |
| ttl | Number | TTL = connectedAt + 3600（1時間） |

**GSI**: `roomCode-index`（PK: `roomCode`）— ルームの参加者一覧を高速取得

---

### DigiRaiseRooms

ルームとバトルセッションの管理。

| 属性 | 型 | 説明 |
|------|-----|------|
| roomCode | String (PK) | 6桁の大文字英数字 |
| status | String | `'waiting'` \| `'ready'` \| `'battling'` \| `'finished'` |
| hostConnectionId | String | ホストの connectionId |
| guestConnectionId | String | ゲストの connectionId（参加後に設定） |
| hostCreature | Map | ホストのクリーチャーデータ |
| guestCreature | Map | ゲストのクリーチャーデータ |
| hostReady | Boolean | ホストのバトル開始準備完了フラグ |
| guestReady | Boolean | ゲストのバトル開始準備完了フラグ |
| hostAction | String | ホストが選択したアクション（ターン中のみ） |
| guestAction | String | ゲストが選択したアクション（ターン中のみ） |
| currentTurn | Number | 現在のターン数 |
| turnPhase | String | `'select'` \| `'resolving'` |
| seed | Number | 現在ターンの乱数シード |
| winner | String | `'host'` \| `'guest'` \| `'draw'`（終了後） |
| createdAt | Number | 作成タイムスタンプ（Unix秒） |
| ttl | Number | TTL = createdAt + 7200（2時間） |

---

### DigiRaiseConfig

設定値のキーバリューストア。

| 属性 | 型 | 説明 |
|------|-----|------|
| configKey | String (PK) | 設定キー名 |
| value | String | 設定値 |
| updatedAt | Number | 更新タイムスタンプ（Unix秒） |

**初期レコード**: `{ configKey: "maintenance_mode", value: "false", updatedAt: 0 }`

---

## 5. Lambda関数仕様

### 共通設定

| 項目 | 値 |
|------|-----|
| Runtime | Node.js 22.x (ESModules) |
| Memory | 128 MB |
| Timeout | 10秒 |
| AWS SDK | v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-apigatewaymanagementapi`) |

---

### digi-raise-connect（$connect）

**環境変数**: `SECRET_KEY`, `CONNECTIONS_TABLE`, `CONFIG_TABLE`

**処理フロー**:

```
1. DigiRaiseConfig から maintenance_mode を取得
   → true の場合: { statusCode: 503 } を返す

2. クエリパラメータ token と ts を検証
   token = HMAC-SHA256(ts, SECRET_KEY) の hex文字列
   - ts が ±60秒以内か確認
   - timingSafeEqual でタイミング攻撃対策
   → 検証失敗: { statusCode: 401 }

3. DigiRaiseConnections にレコードを PutItem
   { connectionId, connectedAt, lastPingAt, messageCount: 0, ttl }
   → 成功: { statusCode: 200 }
   → 失敗: { statusCode: 500 }
```

> **フェイルオープン**: `DigiRaiseConfig` の取得に失敗した場合はメンテナンスモードと見なさず、接続を許可する。

---

### digi-raise-disconnect（$disconnect）

**環境変数**: `CONNECTIONS_TABLE`, `ROOMS_TABLE`, `APIGW_ENDPOINT`

**処理フロー**:

```
1. DigiRaiseConnections から接続レコードを取得

2. roomCode が設定されている場合:
   a. DigiRaiseRooms から該当ルームを取得
   b. status が 'battling' なら:
      - 切断プレイヤーの役割（host/guest）を判定
      - 相手を winner として rooms を 'finished' に更新
      - 相手に { event: 'opponent_disconnected' } を送信
        （GoneException は無視して続行）

3. DigiRaiseConnections からレコードを DeleteItem

4. { statusCode: 200 } を返す
```

---

### digi-raise-message（$default）

**環境変数**: `CONNECTIONS_TABLE`, `ROOMS_TABLE`, `APIGW_ENDPOINT`

**レート制限**:
- 60秒ウィンドウで最大60メッセージ
- `messageCount` を `ADD ... ConditionExpression: messageCount <= 60` でアトミックにインクリメント
- 超過時: connections レコードを削除し `{ statusCode: 429 }` を返す
- `lastPingAt` が60秒以上前の場合: `messageCount` を0にリセット（新しいウィンドウ開始）

**クリーチャーバリデーション** (`create_room` / `join_room` 時):

| チェック項目 | 条件 |
|------------|------|
| evolutionStage | 0〜5 の整数 |
| hp | maxHp 以下 |
| atk / def / spd | 各500以下 |

**アクション一覧**:

#### `create_room`
- ペイロード: `{ action, creature }`
- 6桁英数字（大文字）のルームコードを生成、条件付きPutItemで重複チェック（最大5回）
- rooms に `status: 'waiting'` で作成
- connections の `roomCode` を更新
- 送信: `{ event: 'room_created', roomCode }`

#### `join_room`
- ペイロード: `{ action, roomCode, creature }`
- rooms の status が `'waiting'` でない場合: `ROOM_NOT_AVAILABLE` エラー
- rooms を `'ready'` に更新（guestConnectionId, guestCreature を設定）
- connections の `roomCode` を更新
- ホストへ: `{ event: 'opponent_joined', opponentCreature }`
- ゲストへ: `{ event: 'room_joined', roomCode, hostCreature }`

#### `ready`
- ペイロード: `{ action, roomCode }`
- `hostReady` / `guestReady` フラグを更新
- 両者が ready になったら:
  - `seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)` を生成
  - rooms を `status: 'battling'` に更新
  - 両者に: `{ event: 'battle_start', seed, yourRole: 'host'|'guest' }` を送信

#### `select_action`
- ペイロード: `{ action, roomCode, battleAction: 'attack'|'guard'|'special' }`
- `hostAction` / `guestAction` を更新
- 両者のアクションが揃ったら:
  - 新しい `seed` を生成
  - rooms の `currentTurn +1`、`hostAction / guestAction をリセット`
  - 両者に: `{ event: 'actions_locked', hostAction, guestAction, seed }` を送信

#### `ping`
- `lastPingAt` を現在時刻に更新、`messageCount` を0にリセット
- 送信: `{ event: 'pong' }`

#### `leave_room`
- ペイロード: `{ action, roomCode }`
- `battling` 中なら disconnect と同様のクリーンアップ（相手に `opponent_disconnected` 通知）
- `waiting` / `ready` 中:
  - ホスト退出: ルームを DeleteItem、ゲストがいれば `{ event: 'room_closed' }` 通知
  - ゲスト退出: ルームを `'waiting'` に戻す、ホストに `opponent_disconnected` 通知
- connections の `roomCode` 属性を REMOVE

---

### digi-raise-emergency-shutdown

**環境変数**: `CONFIG_TABLE`

**処理**: `DigiRaiseConfig` に `{ configKey: 'maintenance_mode', value: 'true' }` を PutItem。
CloudWatch Alarm → SNS → Lambda という自動トリガーで呼び出される。

---

## 6. WebSocketメッセージプロトコル

### クライアント → サーバー

```typescript
{ action: 'create_room',   creature: Creature }
{ action: 'join_room',     roomCode: string, creature: Creature }
{ action: 'ready',         roomCode: string }
{ action: 'select_action', roomCode: string, battleAction: 'attack' | 'guard' | 'special' }
{ action: 'ping' }
{ action: 'leave_room',    roomCode: string }
```

### サーバー → クライアント

```typescript
{ event: 'room_created',          roomCode: string }
{ event: 'room_joined',           roomCode: string, hostCreature: CreatureSnapshot }
{ event: 'opponent_joined',       opponentCreature: CreatureSnapshot }
{ event: 'room_closed',           message: string }
{ event: 'battle_start',          seed: number, yourRole: 'host' | 'guest' }
{ event: 'actions_locked',        hostAction: string, guestAction: string, seed: number }
{ event: 'battle_end',            winner: 'host' | 'guest' | 'draw' }
{ event: 'opponent_disconnected' }
{ event: 'error',                 code: string, message: string }
{ event: 'pong' }
```

**エラーコード一覧**:

| code | 意味 |
|------|------|
| `ROOM_NOT_FOUND` | 指定されたルームが存在しない |
| `ROOM_NOT_AVAILABLE` | ルームが waiting 状態でない |
| `INVALID_PAYLOAD` | ペイロードの形式が不正 |
| `UNKNOWN_ACTION` | 不明なアクション |

---

## 7. セキュリティ

### 7.1 接続トークン検証（HMAC-SHA256）

```
token = HMAC-SHA256(ts, SECRET_KEY)  // hex文字列
```

- `ts`: Unix秒（クライアントが生成）
- `SECRET_KEY`: 環境変数（Terraform の `var.secret_key`）
- タイムスタンプが現在時刻 ±60秒以内かチェック
- `timingSafeEqual` でタイミング攻撃対策

> **制限事項**: クライアントサイドにシークレットが露出するため完全な認証ではない。
> スクリプトキディ・偶発的アクセス対策レベル。本格的なBot攻撃にはWAFが必要。

### 7.2 メッセージレート制限

DynamoDB の `ADD messageCount 1 WHERE messageCount <= 60` でアトミックに管理。
60秒ウィンドウで60メッセージを超えた接続は強制削除。

### 7.3 TTL による自動クリーンアップ

| テーブル | TTL |
|---------|-----|
| DigiRaiseConnections | connectedAt + 3600秒（1時間） |
| DigiRaiseRooms | createdAt + 7200秒（2時間） |

### 7.4 API Gateway スロットリング

```
$connect:  レート 10 req/sec
$default:  レート 200 req/sec, バースト 200
```

### 7.5 緊急遮断（CloudWatch Alarm + DynamoDBフラグ）

```
異常検知
  ↓
CloudWatch Alarm（接続数 > 500 / Lambda実行 > 10,000回/時間）
  ↓
SNS Topic → メール通知（var.alert_email 宛）+ Lambda トリガー
  ↓
digi-raise-emergency-shutdown が DigiRaiseConfig に maintenance_mode = true を書き込む
  ↓
$connect Lambda が 503 で全接続を拒否
```

**復旧手順（手動）**:
```bash
aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"false"},"updatedAt":{"N":"0"}}'
```

---

## 8. Terraform デプロイ手順

### 前提条件

- Terraform >= 1.5
- AWS CLI 設定済み（`ap-northeast-1` リージョン）
- Lambda コードが `backend/lambda/` に存在すること

### 初回デプロイ

```bash
cd backend/terraform

terraform init

terraform apply \
  -var="secret_key=<ランダムな32文字以上の文字列>" \
  -var="alert_email=<通知先メールアドレス>"
```

### 出力値

| output | 内容 |
|--------|------|
| `websocket_url` | フロントエンドの `VITE_WS_URL` に設定する WebSocket URL |
| `apigw_endpoint` | Lambda の `APIGW_ENDPOINT` 環境変数に設定する HTTPS URL |
| `connections_table_name` | DigiRaiseConnections テーブル名 |
| `rooms_table_name` | DigiRaiseRooms テーブル名 |
| `config_table_name` | DigiRaiseConfig テーブル名 |

> **注意**: 初回 apply 後、`var.alert_email` 宛に AWS からサブスクリプション確認メールが届く。
> リンクをクリックして承認するまでアラートメールは届かない。

---

## 9. バトルシステム仕様

バトルロジックの実行はフロントエンドが担う（サーバーは同期のみ）。
サーバーが乱数シードを発行し、両クライアントが同じシードで独立してロジックを計算することで同期を保つ。

### ターン解決順序

```
1. 両プレイヤーが select_action を送信
2. 両アクション揃い次第、Lambda が actions_locked イベントを送信（新しいシードを含む）
3. フロントエンドが受け取ったシードで乱数生成器を初期化
4. 先手決定: spd が高い方が先手（同値の場合はシードで決定）
5. 先手のアクション解決
6. 後手のアクション解決
7. 毒・麻痺等の継続効果処理
8. HP が0以下になった場合はバトル終了
9. 次のターン開始 or 結果表示
```

### バトル終了条件

| 条件 | 勝者 |
|------|------|
| いずれかのHP ≤ 0 | 相手プレイヤー |
| 10ターン経過 | HP が多い方（同値: 引き分け） |
| 相手が切断 | 残ったプレイヤー |

### バトル後のステータス反映

| 結果 | 変化 |
|------|------|
| 勝利 | wins +1, exp +(50 + 相手level×5), happiness +20 |
| 敗北 | losses +1, exp +10, happiness -10 |
| 引き分け | exp +25 |

HP はバトル終了時の値を維持する。

---

## 10. コスト試算

### 月間コスト（小規模個人ゲーム: 最大50同時接続・100バトル/日）

| サービス | 使用量 | 月額 |
|---------|--------|------|
| API Gateway メッセージ | 〜50万/月 | 無料枠内（$0） |
| API Gateway 接続時間 | 〜90万分/月 | $0.23 |
| Lambda | 〜6万回/月 | 無料枠内（$0） |
| DynamoDB | 〜1万書き込み/月 | 無料枠内（$0） |
| **合計** | | **約$0.25〜$1/月** |

大量接続攻撃時は CloudWatch Alarm → 緊急遮断で月$10程度に抑制可能。

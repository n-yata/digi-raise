# デジレイズ (DigiRaise) バックエンド仕様書

**更新日**: 2026-04-10

---

## 概要

デジレイズのオンラインバトル機能を提供する WebSocket バックエンド。
ルームベースのマッチングとターン制バトルのサーバーサイド管理を担う。

ダメージ計算・HP 更新はフロントエンドで実行し、サーバーは乱数シード配信・ターン管理・マッチング・不正防止を担当する。

---

## 技術スタック

| 用途 | 技術 |
|------|------|
| 言語 | Go 1.24+ |
| ランタイム | AWS Lambda (provided.al2023) |
| リアルタイム通信 | AWS API Gateway WebSocket API |
| データベース | Amazon DynamoDB |
| IaC | AWS SAM |
| シークレット管理 | AWS SSM Parameter Store |
| 監視 | CloudWatch Alarm + SNS |

---

## アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│  GitHub Pages (フロントエンド PWA)                     │
└────────────────────┬─────────────────────────────────┘
                     │ WebSocket (wss://)
┌────────────────────▼─────────────────────────────────┐
│  API Gateway WebSocket API                            │
│  ├── $connect    → ConnectFunction                    │
│  ├── $disconnect → DisconnectFunction                 │
│  └── $default    → MessageFunction                    │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│  DynamoDB                                             │
│  ├── DigiRaiseConnections (接続管理)                  │
│  ├── DigiRaiseRooms (ルーム・バトル状態)              │
│  └── DigiRaiseConfig (設定)                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  CloudWatch Alarm → SNS → EmergencyShutdownFunction   │
│  (異常検知時の自動遮断)                                │
└──────────────────────────────────────────────────────┘
```

### WebSocket エンドポイント

```
wss://<API_ID>.execute-api.ap-northeast-1.amazonaws.com/prod
（実際のURLは sam deploy の Outputs / frontend/.env の VITE_WS_ENDPOINT を参照）
```

### API Gateway スロットリング

| ルート | レート | バースト |
|--------|--------|---------|
| $connect | 10 req/sec | 20 req |
| $default | 200 req/sec | 400 req |

---

## ディレクトリ構成

```
backend/
├── cmd/
│   ├── connect/main.go              # $connect Lambda エントリーポイント
│   ├── disconnect/main.go           # $disconnect Lambda エントリーポイント
│   ├── message/main.go              # $default Lambda エントリーポイント
│   └── emergency-shutdown/main.go   # 緊急遮断 Lambda エントリーポイント
├── internal/
│   ├── handler/
│   │   ├── connect.go               # 認証・再接続処理
│   │   ├── disconnect.go            # 切断クリーンアップ
│   │   └── message.go               # メッセージルーティング・バトルロジック
│   ├── battle/
│   │   └── room.go                  # ルーム作成・参加ロジック
│   ├── db/
│   │   ├── connections.go           # Connections テーブル操作
│   │   ├── rooms.go                 # Rooms テーブル操作
│   │   └── config.go                # Config テーブル操作
│   ├── apigw/
│   │   └── client.go                # PostToConnection ラッパー
│   └── auth/
│       └── token.go                 # HMAC-SHA256 トークン検証
├── infra/
│   ├── template.yaml                # AWS SAM テンプレート
│   └── samconfig.toml               # SAM デプロイ設定
├── Makefile
├── go.mod
└── go.sum
```

設計方針: `cmd/` は Lambda エントリーポイントのみ（薄いシェル）。ビジネスロジックはすべて `internal/` に集約し、テスト可能にする。

---

## Lambda 関数

### ConnectFunction ($connect)

**目的**: 接続時の認証・セッション登録・再接続処理

処理フロー:
1. メンテナンスモードチェック → `503`
2. HMAC トークン検証 → `401`
3. Connections テーブルに接続レコード作成（TTL: 1時間）
4. `reconnectToken` + `roomCode` クエリパラメータがある場合:
   - ルームの reconnectToken を照合（60秒有効期限）
   - 一致 → ルーム復帰、相手に `reconnected` イベント送信
   - 失敗 → 警告ログのみ（通常接続として継続）
5. `200` を返す

### DisconnectFunction ($disconnect)

**目的**: 切断時のクリーンアップ。バトル中は再接続猶予期間を設ける

処理フロー:
1. Connections テーブルから接続レコードを取得
2. roomCode が設定されている場合:
   - **status = "battling"**: 60秒の再接続猶予を設定（reconnectToken 生成）、相手に `opponent_disconnected` 通知
   - **status = "waiting"**: ルーム削除
   - **status = "ready"**: 相手に通知してルーム削除
3. Connections テーブルからレコード削除

### MessageFunction ($default)

**目的**: 全メッセージのルーティングとバトルロジック

共通処理:
- JSON パース → action フィールドでルーティング
- レート制限: messageCount をアトミックにインクリメント、60 超過で `429`

| action | 処理 |
|--------|------|
| `create_room` | 6桁ルームコード生成（最大5回リトライ）→ `room_created` |
| `join_room` | ルーム参加（条件付き UpdateItem）→ 双方に `opponent_joined` |
| `leave_room` | ルーム退出 → 相手に通知 → ルーム削除 |
| `ready` | ready フラグセット → 両者 ready → `StartBattle` → `battle_start`（seed + role） |
| `select_action` | アクションセット → 30秒タイムアウト判定 → 両者揃い → `actions_locked`（両アクション + seed + turnNumber）→ `AdvanceTurn` |
| `ping` | messageCount リセット + 切断タイムアウト判定 → `pong` |

### EmergencyShutdownFunction (SNS トリガー)

**目的**: CloudWatch Alarm 発火時にメンテナンスモードを有効化

処理: DigiRaiseConfig テーブルの `maintenance_mode` を `"true"` に設定。以後の全 `$connect` が `503` で拒否される。

---

## DynamoDB テーブル設計

### DigiRaiseConnections

接続ごとのセッション管理。

| 属性 | 型 | 説明 |
|------|-----|------|
| connectionId | S (PK) | API Gateway が割り当てる接続ID |
| roomCode | S | 参加中のルームコード |
| connectedAt | N | 接続タイムスタンプ (Unix秒) |
| lastPingAt | N | 最終アクティブタイムスタンプ |
| messageCount | N | 送信メッセージ数 (レート制限用) |
| ttl | N | TTL — connectedAt + 3600秒 |

GSI: `roomCode-index` (PK: roomCode)

### DigiRaiseRooms

ルームとバトルセッションの管理。

| 属性 | 型 | 説明 |
|------|-----|------|
| roomCode | S (PK) | 6桁英数字コード |
| status | S | `waiting` / `ready` / `battling` / `finished` |
| hostConnectionId | S | ホストの connectionId |
| guestConnectionId | S | ゲストの connectionId |
| hostCreature | B | ホストのクリーチャーデータ (JSON) |
| guestCreature | B | ゲストのクリーチャーデータ (JSON) |
| hostReady | BOOL | ホストの ready 状態 |
| guestReady | BOOL | ゲストの ready 状態 |
| currentTurn | N | 現在のターン数 |
| turnPhase | S | `select` / `resolving` |
| turnStartedAt | N | 現在ターンの開始タイムスタンプ |
| hostAction | S | ホストが選択したアクション |
| guestAction | S | ゲストが選択したアクション |
| winner | S | `host` / `guest` / `draw` |
| disconnectedAt | N | 切断タイムスタンプ |
| disconnectedRole | S | 切断した側の role |
| reconnectToken | S | 再接続用トークン |
| createdAt | N | 作成タイムスタンプ |
| ttl | N | TTL — createdAt + 7200秒 |

### DigiRaiseConfig

設定値テーブル。

| 属性 | 型 | 説明 |
|------|-----|------|
| configKey | S (PK) | 設定キー名 |
| value | S | 設定値 |

レコード例: `{ configKey: "maintenance_mode", value: "false" }`

---

## WebSocket メッセージプロトコル

### クライアント → サーバー

```json
{ "action": "create_room",   "creature": {...} }
{ "action": "join_room",     "roomCode": "ABC123", "creature": {...} }
{ "action": "ready",         "roomCode": "ABC123" }
{ "action": "select_action", "roomCode": "ABC123", "battleAction": "attack" }
{ "action": "ping" }
{ "action": "leave_room",    "roomCode": "ABC123" }
```

battleAction: `"attack"` / `"guard"` / `"special"`

### サーバー → クライアント

```json
{ "event": "room_created",          "roomCode": "ABC123" }
{ "event": "opponent_joined",       "opponentCreature": {...} }
{ "event": "battle_start",          "seed": 123456789, "yourRole": "host" }
{ "event": "actions_locked",        "hostAction": "attack", "guestAction": "guard", "seed": 987654321, "turnNumber": 1 }
{ "event": "battle_end",            "winner": "host" }
{ "event": "opponent_disconnected", "timeoutSec": 60 }
{ "event": "reconnected",           "role": "host" }
{ "event": "opponent_left" }
{ "event": "room_left" }
{ "event": "error",                 "code": "RATE_LIMITED", "message": "too many messages" }
{ "event": "pong" }
```

### エラーコード

| コード | 説明 |
|--------|------|
| INVALID_MESSAGE | JSON パースエラー |
| INVALID_ACTION | 不明な action |
| INVALID_ROOM_CODE | ルームコードのフォーマット不正 |
| INVALID_ROOM_STATUS | ルームの status が操作に適さない |
| ROOM_NOT_FOUND | ルームが存在しない |
| ROOM_FULL | ルームが満員 / 参加不可 |
| NOT_IN_ROOM | ルームのメンバーではない |
| CREATE_ROOM_FAILED | ルーム作成失敗 |
| JOIN_ROOM_FAILED | ルーム参加失敗 |
| CANNOT_LEAVE | 現在の status では退出不可 |
| MISSING_ROOM_CODE | roomCode が未指定 |
| RATE_LIMITED | レート制限超過 |
| NOT_IMPLEMENTED | 未実装機能 |
| MAINTENANCE_MODE | メンテナンス中 |

---

## セキュリティ

### 認証 (HMAC-SHA256)

- `$connect` 時にクエリパラメータ `token` を検証
- トークンフォーマット: `{timestamp}.{hmac_hex}`
- HMAC = HMAC-SHA256(timestamp, SECRET_KEY)
- タイムスタンプが現在時刻 ±60秒以内であること
- `hmac.Equal()` で定数時間比較（タイミング攻撃対策）
- SECRET_KEY は SSM Parameter Store (`/digi-raise/hmac-secret-key`) で管理

制限事項: クライアントサイドに SECRET_KEY が露出するため、偶発的アクセスとスクリプトキディ対策レベル。

### レート制限

- Connections テーブルの messageCount をアトミックインクリメント（DynamoDB ADD）
- 60 超過で `429` を返却
- `ping` メッセージ受信時にカウンターをリセット

### アクション二重送信防止

- `SetAction` の ConditionExpression: `status = "battling" AND attribute_not_exists(hostAction|guestAction)`
- 既にアクション設定済みの場合は条件不一致で拒否

### 再接続

- 切断時に `crypto/rand` で 16バイト（128ビット）の reconnectToken を生成
- 60秒の有効期限（`disconnectedAt` からの経過時間で判定）
- `ClearDisconnected` に ConditionExpression で race condition 対策
- エラーメッセージは汎用化（roomCode 等の内部情報を非露出）

### 自動遮断

```
CloudWatch Alarm (接続数 > 500 or Lambda実行 > 10,000/時間)
  → SNS Topic → EmergencyShutdownFunction
  → DigiRaiseConfig: maintenance_mode = "true"
  → $connect が 503 で全接続拒否
```

復旧は手動（DynamoDB の maintenance_mode を "false" に更新）。

---

## バトルフロー

### マッチング

```
Player A: create_room → room_created (roomCode)
Player B: join_room (roomCode) → opponent_joined (双方)
Player A: ready
Player B: ready → battle_start (seed, role) (双方)
```

### ターン進行

```
1. 両プレイヤーが select_action を送信
2. 両者揃い → actions_locked (hostAction, guestAction, seed, turnNumber) を双方に送信
3. フロントエンドが seed で乱数生成器を初期化し、ダメージ計算を実行
4. AdvanceTurn でターン進行（hostAction/guestAction をクリア）
5. 1 に戻る（最大10ターン）
```

### タイムアウト

- アクション選択: 30秒超過で未選択側に `guard` を強制（パッシブチェック方式）
- 切断タイムアウト: 60秒超過で残存プレイヤーの勝利

### バトル終了条件

- いずれかのクリーチャーの HP が 0 以下 → 相手の勝利（フロントエンド判定）
- 10ターン経過 → HP が多い方の勝利（フロントエンド判定）
- 相手が切断し60秒超過 → 残存プレイヤーの勝利（サーバー判定）

### ルームコード

- 6桁英数字（`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`、紛らわしい文字 I/O/0/1 を除外）
- `crypto/rand` で生成、DynamoDB の条件付き PutItem で重複チェック、最大5回リトライ

---

## エラーハンドリング方針

| エラー種別 | レスポンス | Lambda の戻り値 |
|-----------|-----------|----------------|
| クライアント起因（認証失敗、不正入力） | StatusCode: 4xx | error: nil |
| インフラ起因（DynamoDB 障害） | — | error: err（Lambda リトライ） |
| PostToConnection 先が切断済み（GoneException） | — | 無視（nil を返す） |

---

## AWS リソース一覧

SAM テンプレート (`backend/infra/template.yaml`) で管理。

| リソース | 名称 | 設定 |
|---------|------|------|
| API Gateway | digi-raise-battle-ws | WebSocket API |
| Lambda | digi-raise-battle-connect | $connect (Go / provided.al2023) |
| Lambda | digi-raise-battle-disconnect | $disconnect |
| Lambda | digi-raise-battle-message | $default |
| Lambda | digi-raise-battle-emergency-shutdown | SNS トリガー |
| DynamoDB | DigiRaiseConnections | TTL 有効、GSI: roomCode-index |
| DynamoDB | DigiRaiseRooms | TTL 有効 |
| DynamoDB | DigiRaiseConfig | 設定値 |
| SNS | digi-raise-alert | アラート通知 |
| CloudWatch Alarm | digi-raise-connection-spike | 接続数 > 500 |
| CloudWatch Alarm | digi-raise-lambda-spike | Lambda 実行 > 10,000/時間 |
| IAM Role | digi-raise-battle-lambda-role | DynamoDB CRUD + PostToConnection |
| SSM Parameter | /digi-raise/hmac-secret-key | HMAC シークレットキー |

---

## 運用

### メンテナンスモード解除

```bash
MSYS_NO_PATHCONV=1 aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"false"}}' \
  --region ap-northeast-1
```

### メンテナンスモード手動有効化

```bash
MSYS_NO_PATHCONV=1 aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"true"}}' \
  --region ap-northeast-1
```

### CloudWatch ログ確認

```bash
aws logs tail /aws/lambda/digi-raise-battle-message --region ap-northeast-1 --follow
aws logs tail /aws/lambda/digi-raise-battle-connect --region ap-northeast-1 --follow
```

### コスト試算（小規模個人ゲーム想定: 最大50同時接続、100バトル/日）

| サービス | 月額 |
|---------|------|
| API Gateway | ~$0.23 |
| Lambda | 無料枠内 |
| DynamoDB | 無料枠内 |
| SNS | 無料 |
| SSM Parameter Store | 無料 |
| CloudWatch Alarm | 無料枠内 |
| **合計** | **~$0.25/月** |

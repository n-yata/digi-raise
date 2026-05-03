# 対戦機能実装計画 — デジレイズ バトル機能

**作成日**: 2026-04-04
**最終更新**: 2026-04-10
**対象プロジェクト**: digi-raise PWA
**バックエンド言語**: Go
**IaC**: AWS SAM

---

## 1. フェーズ分け

### Phase 1: バックエンド基盤
Go プロジェクト初期化、SAM テンプレートで AWS リソース作成、WebSocket 接続の基本動作確認。セキュリティ対策の実装を含む。

### Phase 2: マッチングシステム
ルームコード生成・参加・キャンセルのロジックとフロントエンドのマッチング画面。

### Phase 3: バトルシステムコア
バトルロジック（フロントエンド実装）とバトル画面UI。

### Phase 4: 結果反映・最終調整
勝敗によるステータス反映、バトル履歴、各種エラーハンドリングの整備。

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
│  ├── $connect    → Lambda: ConnectHandler                │
│  ├── $disconnect → Lambda: DisconnectHandler             │
│  └── $default    → Lambda: MessageHandler                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  DynamoDB                                                │
│  ├── connections テーブル (接続情報)                     │
│  └── rooms テーブル (ルーム・バトル状態)                 │
└─────────────────────────────────────────────────────────┘
```

**作成するAWSリソース一覧**:

| リソース | 名称 | 設定 |
|---------|------|------|
| API Gateway | digi-raise-battle-ws | WebSocket API |
| Lambda | digi-raise-connect | $connect ルート (Go / provided.al2023) |
| Lambda | digi-raise-disconnect | $disconnect ルート (Go / provided.al2023) |
| Lambda | digi-raise-message | $default ルート (Go / provided.al2023) |
| DynamoDB | DigiRaiseConnections | connections テーブル |
| DynamoDB | DigiRaiseRooms | rooms テーブル |
| IAM Role | digi-raise-lambda-role | Lambda実行ロール |
| CloudWatch | digi-raise-battle-logs | ログ管理 |

---

## 3. DynamoDBテーブル設計

### テーブル1: DigiRaiseConnections

接続ごとのセッション管理。

```
Primary Key:
  connectionId (String) — API Gateway が割り当てる接続ID

Attributes:
  connectionId  String   PK
  roomCode      String   参加中のルームコード (未参加時は null)
  connectedAt   Number   接続タイムスタンプ (Unix秒)
  lastPingAt    Number   最終アクティブタイムスタンプ
  messageCount  Number   送信メッセージ数 (レート制限用)
  ttl           Number   TTL (Unix秒) — connectedAt + 3600 (1時間)

GSI:
  roomCode-index: roomCode (PK) — ルームの参加者一覧を高速取得
```

### テーブル2: DigiRaiseRooms

ルームとバトルセッションの管理。

```
Primary Key:
  roomCode (String) — 4〜6桁の英数字

Attributes:
  roomCode              String  PK
  status                String  'waiting' | 'ready' | 'battling' | 'finished'
  hostConnectionId      String  ホストの connectionId
  guestConnectionId     String  ゲストの connectionId (参加後に設定)
  hostCreature          Map     ホストのクリーチャーデータ (スナップショット)
  guestCreature         Map     ゲストのクリーチャーデータ (スナップショット)
  currentTurn           Number  現在のターン数
  turnPhase             String  'select' | 'resolving'
  turnStartedAt         Number  現在ターンの開始タイムスタンプ (タイムアウト判定用)
  hostAction            String  ホストが選択したアクション
  guestAction           String  ゲストが選択したアクション
  battleLog             List    ターンごとの戦闘ログ
  winner                String  'host' | 'guest' | 'draw' (終了後)
  disconnectedAt        Number  切断タイムスタンプ (null = 両者接続中)
  disconnectedRole      String  'host' | 'guest' (どちらが切断したか)
  reconnectToken        String  再接続用の使い捨てトークン
  createdAt             Number  作成タイムスタンプ
  ttl                   Number  TTL — createdAt + 7200 (2時間)
```

**TTL設定の意図**: 接続が切断されたまま放置されたルームを自動削除し、DynamoDBの容量とコストを抑制する。

---

## 4. Lambda関数の設計

### Lambda 1: digi-raise-connect ($connect)

**目的**: 接続時の認証・レート制限・セッション登録。

```
処理フロー:
1. クエリパラメータ token を検証
   - token = HMAC-SHA256(timestamp + SECRET_KEY)
   - タイムスタンプが現在時刻 ±60秒以内かチェック
   - 検証失敗 → 401 を返して接続拒否

2. DigiRaiseConnections テーブルに新規レコードを作成
   {
     connectionId: event.requestContext.connectionId,
     connectedAt: now,
     lastPingAt: now,
     messageCount: 0,
     ttl: now + 3600
   }

3. 200 を返す (成功)
```

### Lambda 2: digi-raise-disconnect ($disconnect)

**目的**: 接続切断時のクリーンアップ。再接続猶予期間（60秒）を設ける。

```
処理フロー:
1. connections テーブルから接続レコードを取得
2. roomCode が設定されていた場合:
   a. rooms テーブルの該当ルームを取得
   b. status が 'battling' の場合:
      - rooms に disconnectedAt = now, disconnectedRole を記録
      - reconnectToken を生成して rooms に保存
      - 相手プレイヤーへ opponent_disconnected メッセージを送信
      - バトルは即終了しない（status は 'battling' のまま）
      - 60秒の猶予期間後、次のメッセージ受信時にタイムアウト判定
   c. status が 'waiting' の場合:
      - rooms レコードを削除
3. connections テーブルからレコードを削除
```

### Lambda 3: digi-raise-message ($default)

**目的**: 全メッセージのルーティング。メッセージ種別に応じた処理を担う。

```
メッセージレート制限の実装:
- connections テーブルの messageCount をアトミックにインクリメント
- messageCount > 60 (60秒あたり60メッセージ) → 接続を強制切断
- lastPingAt を基準に、一定時間経過後にカウンターをリセット

受け付けるメッセージ種別:
  action: 'create_room'   → ルームを作成してルームコードを返す
  action: 'join_room'     → ルームコードで入室
  action: 'ready'         → バトル開始の準備完了
  action: 'select_action' → バトルアクション選択 (attack/guard/special)
  action: 'ping'          → 接続維持用 (lastPingAt を更新)
  action: 'leave_room'    → ルーム離脱

select_action のタイムアウト処理:
  - turnStartedAt から30秒経過を検知したら、未選択側に guard を強制割り当て
  - パッシブチェック方式（追加Lambda不要、メッセージ受信時に判定）
```

**ルームコード生成ロジック (create_room)**:

```
1. ランダムな6桁英数字コードを生成
2. rooms テーブルで重複チェック (条件付きPutItem)
3. 重複していたら再生成 (最大5回試行)
4. rooms レコードを status='waiting' で作成
5. connections レコードに roomCode を設定
6. クライアントへ room_created イベントを送信
```

---

## 5. バトルシステム仕様

### 5.1 バトルの基本ルール

- **形式**: ターン制 (最大10ターン)
- **同時行動**: 両者が同時にアクションを選択し、両者選択完了後にLambdaが通知
- **ロジック実行場所**: フロントエンド（双方が同じ計算を独立して実行、乱数シードで同期）

### 5.2 アクション種別

| アクション | 効果 | 備考 |
|-----------|------|------|
| `attack`  | 物理攻撃 | 最も基本のアクション |
| `guard`   | 防御 (+50% DEF) | そのターンは攻撃しない |
| `special` | 特殊攻撃 (タイプ依存) | クールダウン2ターン |

### 5.3 ダメージ計算式

```
baseDamage = attacker.atk * 1.5 - defender.def * 0.8
typeMod    = TYPE_ADVANTAGE[attacker.type][defender.type]  // 0.8, 1.0, 1.2
spdMod     = attacker.spd > defender.spd ? 1.1 : 0.9      // 先手補正

finalDamage = Math.max(1, Math.floor(baseDamage * typeMod * spdMod))
```

### 5.4 タイプ相性マトリクス

```
           Fire  Water Plant Thunder Dark  Light
Fire       1.0   0.8   1.2   1.0    1.0   1.0
Water      1.2   1.0   0.8   1.0    1.0   1.0
Plant      0.8   1.2   1.0   1.0    1.0   1.0
Thunder    1.0   1.2   1.0   1.0    0.8   1.2
Dark       1.0   1.0   1.0   1.2    1.0   0.8
Light      1.0   1.0   1.0   0.8    1.2   1.0
```

### 5.5 特殊アクション (special) のタイプ別効果

| タイプ | 効果 |
|-------|------|
| Fire | 連続2回攻撃 (各ダメージ×0.7) |
| Water | 自己回復 (maxHp × 0.2) + 攻撃 |
| Plant | 毒付与 (3ターン、毎ターン最大HP×3%ダメージ) |
| Thunder | 麻痺 (次ターン行動不可 50%確率) |
| Dark | 相手のATKを1ターン−30% |
| Light | 防御バフ (自DEF×1.5、2ターン) |

### 5.6 ターン解決順序

```
1. 両プレイヤーがアクション選択完了
2. Lambda が両者に 'actions_locked' イベントを送信 (乱数シードを含む)
3. フロントエンドが受け取ったシードで乱数生成器を初期化
4. 先手決定: spd が高い方が先手 (同値の場合はシードで決定)
5. 先手のアクション解決
6. 後手のアクション解決
7. 毒・麻痺等の継続効果処理
8. HP が0以下になった場合はバトル終了
9. 次のターン開始 or 結果表示
```

### 5.7 バトル終了条件

- いずれかのクリーチャーのHPが0以下 → 相手の勝利
- 10ターン経過 → HP が多い方の勝利 (同値の場合は引き分け)
- 相手が切断 → 残ったプレイヤーの勝利

### 5.8 バトル後のステータス反映

| 結果 | 変化 |
|------|------|
| 勝利 | wins +1, exp +50+(相手level×5), happiness +20 |
| 敗北 | losses +1, exp +10, happiness -10 |
| 引き分け | exp +25 |

HP はバトル終了時の値を維持する。

---

## 6. フロントエンドの変更箇所

### 6.1 型定義の拡張

`src/types/creature.ts`:
- `GameScreen` に `'battle_lobby' | 'battle'` を追加
- `Creature` に `wins: number`, `losses: number` フィールドを追加（未定義の場合）

### 6.2 新規コンポーネント

| コンポーネント | パス | 役割 |
|--------------|------|------|
| BattleLobbyScreen | `src/components/BattleLobbyScreen.tsx` | ルーム作成・参加UI |
| BattleScreen | `src/components/BattleScreen.tsx` | バトルメイン画面 |
| BattleActionButtons | `src/components/BattleActionButtons.tsx` | attack/guard/special ボタン |
| BattleResult | `src/components/BattleResult.tsx` | 勝敗結果モーダル |
| BattleHPBar | `src/components/BattleHPBar.tsx` | バトル用HPバー (2体分) |

### 6.3 新規フック

| フック | パス | 役割 |
|-------|------|------|
| useBattleWebSocket | `src/hooks/useBattleWebSocket.ts` | WebSocket接続管理・メッセージハンドリング |
| useBattleState | `src/hooks/useBattleState.ts` | バトル状態管理 (useReducer) |

### 6.4 新規ユーティリティ

| ユーティリティ | パス | 役割 |
|--------------|------|------|
| battleLogic | `src/utils/battleLogic.ts` | ダメージ計算・ターン解決・タイプ相性 |
| battleTypes | `src/types/battle.ts` | バトル専用型定義 |
| wsToken | `src/utils/wsToken.ts` | WebSocket接続トークン生成 |

### 6.5 既存ファイルの変更

| ファイル | 変更内容 |
|---------|---------|
| `src/App.tsx` | `'battle_lobby'` / `'battle'` 画面の分岐追加 |
| `src/components/MainGame.tsx` | バトルボタン（⚔️ バトル）追加、`onBattle` props追加 |
| `src/hooks/useGameState.ts` | バトル結果反映の Action / reducer 拡張 |

### 6.6 画面遷移図（追加分）

```
main → battle_lobby → battle → main (勝敗結果反映後)
                    ↘ main (キャンセル)
```

---

## 7. セキュリティ対策

### 7.1 $connect ルートのトークン検証（簡易HMAC）

フロントエンドがタイムスタンプベースのHMACトークンを生成し、Lambdaで検証する。
タイムスタンプが ±60秒以内かつHMAC一致しない場合は401で接続拒否。

> **制限事項**: クライアントサイドにシークレットが露出するため完全な認証ではない。
> 偶発的アクセスとスクリプトキディ対策レベル。本格的なBot攻撃にはWAFが必要。

### 7.2 メッセージレート制限

DynamoDBのアトミック更新でメッセージカウントを管理。
60秒間に60メッセージを超えた場合は強制切断。

### 7.3 DynamoDB TTL による自動クリーンアップ

| テーブル | TTL |
|---------|-----|
| DigiRaiseConnections | connectedAt + 3600秒 (1時間) |
| DigiRaiseRooms | createdAt + 7200秒 (2時間) |

### 7.4 クリーチャーデータの検証 ($connect 時)

Lambda側でデータの妥当性を検証し、以下の場合は接続を切断する:
- `evolutionStage` が 0〜5 の範囲外
- `hp` が `maxHp` を超えている
- `atk/def/spd` がステージ基準値の10倍を超えている（異常値）

### 7.5 API Gateway スロットリング設定

```
$connect:  レート 10 req/sec
$default:  レート 200 req/sec
バースト:  200 req
```

### 7.6 CloudWatch Alarms + 自動遮断（DynamoDBフラグ方式）

異常検知時に自動で接続を遮断し、手動で復旧する「自動遮断 → 手動復旧」パターンを採用する。

#### フロー

```
異常検知
  ↓
CloudWatch Alarm (接続数 > 500 / Lambda実行 > 10,000回/時間)
  ↓
SNS Topic → メール通知（シャビへ）
  ↓ (Lambda をトリガー)
Lambda: digi-raise-emergency-shutdown
  ↓
DynamoDB DigiRaiseConfig に maintenance_mode = true を書き込む
  ↓
$connect Lambda が maintenance_mode を読んで全接続を 503 で拒否
```

#### 追加AWSリソース

| リソース | 名称 | 設定 |
|---------|------|------|
| DynamoDB | DigiRaiseConfig | 設定値テーブル (PK: configKey) |
| Lambda | digi-raise-emergency-shutdown | Alarm発火時に自動実行 |
| SNS Topic | digi-raise-alert | Alarm → Lambda + メール通知 |
| CloudWatch Alarm | digi-raise-connection-spike | API Gateway接続数 > 500 |
| CloudWatch Alarm | digi-raise-lambda-spike | Lambda実行回数 > 10,000/時間 |

#### DigiRaiseConfig テーブル設計

```
Primary Key:
  configKey (String) — 設定キー名

レコード例:
  { configKey: 'maintenance_mode', value: 'false', updatedAt: 1234567890 }
```

#### digi-raise-emergency-shutdown の処理 (Go)

```go
func (h *EmergencyShutdownHandler) Handle(ctx context.Context) error {
    return h.config.SetMaintenanceMode(ctx, true)
    // SNS経由でメール通知も同時に飛ぶ (CloudWatch Alarm設定で対応)
}
```

#### $connect Lambda への追加処理 (Go)

```go
// 既存トークン検証の前に maintenance_mode をチェック
if maint, _ := h.config.GetMaintenanceMode(ctx); maint {
    return events.APIGatewayProxyResponse{StatusCode: 503}, nil // 全接続を拒否
}
```

#### 復旧手順（手動）

1. メール通知を受け取る
2. AWS コンソール or CLI で状況を確認
3. 異常が収まっていることを確認後、DynamoDBの `maintenance_mode` を `false` に更新
4. 接続が再開される（Lambda の再デプロイ不要）

```bash
# CLI での復旧コマンド例
aws dynamodb put-item \
  --table-name DigiRaiseConfig \
  --item '{"configKey":{"S":"maintenance_mode"},"value":{"S":"false"}}'
```

#### 注意事項

- メンテナンスモード中は**正常ユーザーも接続できない**
- フロントエンドは503受信時に「メンテナンス中」メッセージを表示する実装を追加する
- `DigiRaiseConfig` の初期レコードを必ず `maintenance_mode = false` で作成しておくこと

---

## 8. WebSocketメッセージプロトコル

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
{ event: 'room_created',          roomCode: string, reconnectToken: string }
{ event: 'opponent_joined',       opponentCreature: CreatureSnapshot }
{ event: 'battle_start',          seed: number, yourRole: 'host' | 'guest' }
{ event: 'actions_locked',        hostAction: string, guestAction: string, seed: number }
{ event: 'turn_resolved',         turnNumber: number }
{ event: 'battle_end',            winner: 'host' | 'guest' | 'draw' }
{ event: 'opponent_disconnected', timeoutSec: 60 }
{ event: 'reconnected',          role: 'host' | 'guest' }
{ event: 'error',                 code: string, message: string }
{ event: 'pong' }
```

---

## 9. コスト試算

### 月間コスト（小規模個人ゲーム想定: 最大50同時接続、100バトル/日）

| サービス | 使用量 | 月額 |
|---------|--------|------|
| API Gateway メッセージ | 〜50万/月 | 無料枠内 ($0) |
| API Gateway 接続時間 | 〜90万分/月 | $0.23 |
| Lambda | 〜6万回/月 | 無料枠内 ($0) |
| DynamoDB | 〜1万書き込み/月 | 無料枠内 ($0) |
| **合計** | | **約$0.25〜$1/月** |

### 最悪ケース（大量接続攻撃時）

CloudWatch Alarmで検知 → Lambda内で接続を即拒否することで月$10程度に抑制可能。

---

## 10. Goプロジェクト構成

バックエンドの Go コードはモノレポ内の `backend/` ディレクトリに配置する。フロントエンドとの設定（WebSocket URL 等）が密結合しているため、同一リポジトリで管理する。

```
digi-raise/
├── src/                          # フロントエンド (既存)
├── backend/
│   ├── go.mod                    # module digi-raise/backend
│   ├── go.sum
│   ├── Makefile                  # ビルド・デプロイコマンド
│   ├── cmd/
│   │   ├── connect/
│   │   │   └── main.go           # digi-raise-connect Lambda エントリーポイント
│   │   ├── disconnect/
│   │   │   └── main.go           # digi-raise-disconnect Lambda エントリーポイント
│   │   ├── message/
│   │   │   └── main.go           # digi-raise-message Lambda エントリーポイント
│   │   └── emergency-shutdown/
│   │       └── main.go           # digi-raise-emergency-shutdown Lambda エントリーポイント
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── connect.go        # ConnectHandler (ロジック本体)
│   │   │   ├── disconnect.go     # DisconnectHandler
│   │   │   └── message.go        # MessageHandler + メッセージルーティング
│   │   ├── battle/
│   │   │   └── room.go           # ルーム操作ロジック (create/join/leave/action)
│   │   ├── db/
│   │   │   ├── connections.go    # DigiRaiseConnections テーブル操作
│   │   │   ├── rooms.go          # DigiRaiseRooms テーブル操作
│   │   │   └── config.go         # DigiRaiseConfig テーブル操作
│   │   ├── apigw/
│   │   │   └── client.go         # PostToConnection ラッパー
│   │   └── auth/
│   │       └── token.go          # HMAC トークン検証
│   └── infra/
│       ├── template.yaml         # AWS SAM テンプレート
│       └── samconfig.toml        # SAM デプロイ設定
```

**設計方針**: `cmd/` は Lambda のエントリーポイントのみ（薄いシェル）。ビジネスロジックはすべて `internal/` に集約し、ユニットテストを書きやすくする。

---

## 11. ビルド・デプロイ

### Lambda ランタイム

- ランタイム: `provided.al2023`（Go カスタムランタイム）
- バイナリ名: `bootstrap`（ランタイム要件）
- ビルドフラグ: `-tags lambda.norpc`（RPC サーバー除外、コールドスタート高速化）
- クロスコンパイル: `GOOS=linux GOARCH=amd64 CGO_ENABLED=0`

### Makefile

```makefile
GOOS=linux
GOARCH=amd64
CGO_ENABLED=0

FUNCTIONS = connect disconnect message emergency-shutdown

.PHONY: build deploy clean test

build:
	@for fn in $(FUNCTIONS); do \
		echo "Building $$fn..."; \
		GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build -tags lambda.norpc \
		-o dist/$$fn/bootstrap \
		./cmd/$$fn/; \
	done

deploy: build
	sam deploy --config-file infra/samconfig.toml

clean:
	rm -rf dist/

test:
	go test ./...
```

### SAM テンプレート (抜粋)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: provided.al2023
    Architectures: [x86_64]
    Timeout: 10
    MemorySize: 128
    Environment:
      Variables:
        CONNECTIONS_TABLE: DigiRaiseConnections
        ROOMS_TABLE: DigiRaiseRooms
        CONFIG_TABLE: DigiRaiseConfig
        SECRET_KEY: !Ref HmacSecretKey

Parameters:
  HmacSecretKey:
    Type: AWS::SSM::Parameter::Value<String>
    Default: /digi-raise/hmac-secret-key

Resources:
  ConnectFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ../dist/connect/
      Handler: bootstrap
      Events:
        ConnectRoute:
          Type: WebSocket
          Properties:
            ApiId: !Ref BattleWebSocketApi
            RouteKey: $connect
```

シークレットキーは SSM Parameter Store で管理し、テンプレートにハードコードしない。

---

## 12. エラーハンドリングパターン (Go)

### 方針

- クライアント起因エラー（認証失敗、不正入力）→ `StatusCode: 4xx`, `error: nil`
- インフラ起因エラー（DynamoDB障害）→ `error: err`（Lambda がリトライ）
- `PostToConnection` で相手側の接続が既に切れていた場合（`GoneException`）→ 正常系として無視

### エラーコード定義

```go
const (
    ErrRoomNotFound    = "ROOM_NOT_FOUND"     // 存在しないルームに参加試行
    ErrRoomFull        = "ROOM_FULL"          // 満員のルームに参加試行
    ErrRoomNotWaiting  = "ROOM_NOT_WAITING"   // バトル中のルームに参加試行
    ErrNotInRoom       = "NOT_IN_ROOM"        // ルーム未参加でバトルアクション送信
    ErrNotYourTurn     = "NOT_YOUR_TURN"      // 既にアクション選択済み
    ErrInvalidAction   = "INVALID_ACTION"     // 不正なアクション種別
    ErrSpecialCooldown = "SPECIAL_COOLDOWN"   // special クールダウン中
    ErrMaintenanceMode = "MAINTENANCE_MODE"   // メンテナンス中
    ErrRateLimited     = "RATE_LIMITED"       // レート制限超過
    ErrClientTooOld    = "CLIENT_TOO_OLD"     // クライアントバージョン古い
)
```

### Lambda ハンドラのパターン

```go
func (h *ConnectHandler) Handle(ctx context.Context, req events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    // メンテナンスモードチェック
    if maint, _ := h.config.GetMaintenanceMode(ctx); maint {
        return events.APIGatewayProxyResponse{StatusCode: 503}, nil
    }

    // トークン検証
    token := req.QueryStringParameters["token"]
    if err := h.auth.Verify(token); err != nil {
        return events.APIGatewayProxyResponse{StatusCode: 401}, nil
    }

    // クライアントバージョン検証
    clientVersion := req.QueryStringParameters["clientVersion"]
    if !isCompatibleVersion(clientVersion) {
        return events.APIGatewayProxyResponse{StatusCode: 426}, nil // Upgrade Required
    }

    // DB書き込み（インフラ障害は error として返し Lambda にリトライさせる）
    if err := h.connections.Create(ctx, req.RequestContext.ConnectionID); err != nil {
        return events.APIGatewayProxyResponse{}, err
    }

    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}
```

---

## 13. 再接続ロジック

モバイルでの一時的なネットワーク断を考慮し、**60秒の再接続猶予期間**を設ける。

### フロー

```
1. $disconnect 発火
   → rooms.disconnectedAt = now, disconnectedRole を記録
   → reconnectToken を生成して rooms に保存
   → 相手に "opponent_disconnected" を通知（接続待ち状態へ）
   → バトルは即終了しない（status は 'battling' のまま）

2. 相手側フロントエンド
   → "opponent_disconnected" 受信後、60秒のカウントダウン表示
   → 60秒以内に再接続がなければ「相手の切断による勝利」を確定

3. 切断したプレイヤーがネットワーク回復後に $connect
   → クエリパラメータに reconnectToken を含めて接続
   → ConnectHandler が rooms テーブルで reconnectToken を照合
   → 一致すれば同じルームに復帰し "reconnected" イベントを双方に通知
   → rooms.disconnectedAt を null にリセット

4. 60秒タイムアウト処理
   → Lambda(message) の ping ハンドラ or 次の select_action 受信時に
     disconnectedAt から経過時間をチェック
   → 60秒超過 → バトル終了、残存プレイヤーを勝者に確定
```

### reconnectToken の管理

- `$connect` 時にサーバー側でランダム生成し、クライアントへ返す
- フロントエンドは localStorage に保存
- 使用後は無効化（TTL: 5分）

---

## 14. アクション選択タイムアウト

**30秒のアクション選択制限時間**を設ける。パッシブチェック方式（追加 Lambda 不要）。

### サーバー側

```
select_action 受信時の処理:
1. rooms.turnStartedAt から経過時間を計算
2. 30秒超過の場合:
   - 未選択側に guard を強制割り当て
   - 両者のアクションが揃った状態として処理続行
3. 30秒以内の場合:
   - 通常のアクション処理
```

### フロントエンド側

- 残り時間カウントダウン UI を表示
- 0秒になったら `guard` を自動送信
- ネットワーク遅延によりサーバーとずれる可能性があるため、サーバー側チェックを正とする

---

## 15. バトル状態不整合対策

フロントエンド2者が同じシード・同じ入力で計算するため理論上は一致するが、以下のケースで乖離が生じうる。

| ケース | 原因 | 対策 |
|--------|------|------|
| 浮動小数点誤差 | 計算順序次第でビット単位でずれる | `Math.floor` のタイミングを仕様で厳密に定義し、関数の呼び出し順序をターン解決仕様に固定 |
| バージョン差異 | PWA のキャッシュが古いと計算式が異なる | Service Worker のキャッシュバスティング + `$connect` 時に clientVersion をサーバーへ通知、古ければ 426 で接続拒否しリロードを促す |
| 確率処理のずれ | 乱数の消費順序がずれる | 順序を持つ Seeded RNG を使用し、使用箇所をすべてコメントで明記 |

---

## 16. WebSocket 再接続戦略（フロントエンド側）

`useBattleWebSocket.ts` に指数バックオフの再接続ロジックを実装する。

```
再接続間隔: 1s → 2s → 4s → 8s → 16s → 最大30s
正常切断 (code=1000) の場合は再接続しない
接続成功でリトライカウンターをリセット
再接続時は reconnectToken をクエリパラメータに含める
```

---

## 17. テスト戦略 (Go)

### インターフェース抽象化

DynamoDB と API Gateway はインターフェースで抽象化し、モックに差し替えてテストする。

```go
type ConnectionStore interface {
    Create(ctx context.Context, connID string) error
    Get(ctx context.Context, connID string) (*ConnectionRecord, error)
    Delete(ctx context.Context, connID string) error
    IncrementMessageCount(ctx context.Context, connID string) (int, error)
}

type RoomStore interface {
    CreateRoom(ctx context.Context, roomCode, hostConnID string) error
    GetRoom(ctx context.Context, roomCode string) (*RoomRecord, error)
    SetActionAndCheckReady(ctx context.Context, roomCode, role, action string) (bool, string, string, error)
}
```

### 統合テスト

`sam local start-api` + DynamoDB Local の組み合わせで E2E に近いテストが可能。ただし、まずユニットテストの充実を優先する。

---

## 18. 実装順序

```
Step 0: backend/ ディレクトリ作成、go.mod 初期化、Makefile 作成
Step 1: SAM template.yaml で DynamoDB テーブルと IAM ロールを定義 → sam deploy
Step 2: connect/disconnect Lambda 実装 → sam deploy → wscat で接続テスト
Step 3: message Lambda 実装 (create_room/join_room) → ロビー画面と疎通確認
Step 4: select_action / actions_locked 実装 → バトルコアと疎通確認
Step 5: 再接続ロジック、タイムアウト、エラーハンドリング整備
Step 6: CloudWatch Alarm + emergency-shutdown Lambda 追加
```

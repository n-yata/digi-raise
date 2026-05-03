# ユビキタス言語定義

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-05-04 |
| 担当 | モドリッチ |

> プロジェクトで使用する用語の統一定義。
> コード上の命名・ドキュメント・チャットでの議論すべてで本書に従う。
> 新しい用語が出てきたら **該当カテゴリの末尾に追記** する。

---

## ドメイン用語（ゲーム）

| 用語 | 英語 | 定義 |
|------|------|------|
| クリーチャー | Creature | プレイヤーが育成する個体。1 セーブデータに最大 5 体（墓石含む） |
| アクティブクリーチャー | Active Creature | 現在操作・時間進行している 1 体。バトルに自動参加 |
| 墓石 | Tombstone | `isAlive: false` の死亡したクリーチャー。リストに残り閲覧可能だが操作不可 |
| 進化ステージ | Evolution Stage | クリーチャーの成長段階。0〜5 の整数で管理 |
| タマゴ | Egg | 進化ステージ 0。タップで即時ベイビーに進化 |
| ベイビー | Baby | 進化ステージ 1 |
| チャイルド | Child | 進化ステージ 2。`age ≥ 1` で進化 |
| アダルト | Adult | 進化ステージ 3。`age ≥ 3` AND `happiness ≥ 50` で進化 |
| パーフェクト | Perfect | 進化ステージ 4。`age ≥ 6` AND `level ≥ 8` AND `atk + def + spd ≥ 40` で進化 |
| アルティメット | Ultimate | 進化ステージ 5（最終）。`age ≥ 12` AND `level ≥ 14` AND 各ステータス `≥ 20` で進化 |
| タイプ | Type | クリーチャーの属性。Fire / Water / Plant / Thunder / Dark / Light の 6 種 |
| ティック | Tick | 時間更新の最小単位。通常モード 30 分、devMode 30 秒 |
| age | age | クリーチャー年齢（float）。1 ティックごとに +0.5。表示は `Math.floor(age)` 日 |
| 満腹度 | Hunger | 0〜100。0 で餓死ダメージ、100 でこれ以上食べられない |
| しあわせ度 | Happiness | 0〜100。進化条件・あそぶで上昇、時間経過で減少 |
| えさ / ごはん | Feed | 育成アクションの 1 つ。hunger +30、happiness +5。EXP 付与なし |
| トレーニング | Training | 育成アクション。もぐらたたきミニゲーム（3×3、8 秒、5 匹以上で成功） |
| あそぶ | Play | 育成アクション。神経衰弱ミニゲーム（2×3、3 ペア、8 手以内で成功）。EXP 付与なし |
| ねる | Sleep | 睡眠状態をトグル。1 ティックごとに HP +ceil(maxHp × 0.1) |
| 特殊アクション | Special | バトルアクションの 1 つ。タイプ別効果、クールダウン 2 ターン |
| タイプ相性 | Type Advantage | タイプ間のダメージ補正（×0.8 / ×1.0 / ×1.2）。正本は `frontend/src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` |
| 連撃 | Multi-Hit | Fire の特殊効果。連続 2 回攻撃（各ダメージ ×0.7） |
| 毒 | Poison | Plant の特殊効果。3 ターンの間、毎ターン最大 HP × 3% ダメージ |
| 麻痺 | Paralysis | Thunder の特殊効果。次ターン行動不可（50% 確率） |
| 防御バフ | Defense Buff | Light の特殊効果。自 DEF × 1.5、2 ターン継続 |
| ルームコード | Room Code | バトルマッチング用 6 桁英数字。紛らわしい I / O / 0 / 1 を除外 |
| ホスト | Host | ルーム作成側のプレイヤー |
| ゲスト | Guest | ルーム参加側のプレイヤー |
| シード | Seed | LCG 乱数生成器の初期値。サーバーが発行し、両クライアントが同期計算に使用 |
| devMode | — | 時間スケール加速モード（30 分 → 30 秒）。メイン画面ヘッダー「DEV」ボタンで切替 |
| お絵描き | Drawing | 進化のたびに表示される 64×64 ピクセルアートキャンバス。SVG として保存 |
| QR バトル | QR Battle | 相手のクリーチャーデータを QR 経由で受け取り、CPU AI 駆動でローカルバトル |
| CPU バトル | CPU Battle | フロントエンド完結のオフライン対戦。CPU はランダムにアクション選択 |

---

## ソフトウェア用語

| 用語 | 役割・用途 |
|------|----------|
| React 18 | フロントエンド UI フレームワーク |
| TypeScript 5.x | フロント言語（strict mode） |
| Vite 5 | フロント開発サーバー / ビルドツール |
| Tailwind CSS v3 | ユーティリティファースト CSS |
| vite-plugin-pwa | Service Worker / Manifest 自動生成（Workbox 利用） |
| idb | IndexedDB の型安全ラッパー |
| Vitest | フロントエンドテストランナー |
| ESLint | フロントエンド Lint（`max-warnings 0`） |
| Press Start 2P | レトロゲーム調フォント（Google Fonts） |
| Go 1.24+ | バックエンド言語 |
| AWS Lambda | サーバーレスランタイム（`provided.al2023`） |
| AWS SAM | サーバーレスアプリ IaC（`template.yaml` / `samconfig.toml`） |
| API Gateway WebSocket | クライアント・Lambda 間のリアルタイム通信 |
| DynamoDB | NoSQL データベース（オンデマンド請求、TTL 有効） |
| SSM Parameter Store | AWS のシークレット・設定値管理（HMAC 鍵格納） |
| SNS | 通知サービス（CloudWatch Alarm → 緊急遮断 Lambda） |
| CloudWatch | ログ・メトリクス・アラーム |
| GitHub Pages | フロントエンドの静的配信 |
| GitHub Actions | CI/CD パイプライン |
| HMAC | Hash-based Message Authentication Code。$connect トークン検証に SHA-256 を使用 |
| LCG | Linear Congruential Generator。バトル乱数の同期方式（`state = (state * 1664525 + 1013904223) & 0xFFFFFFFF`） |
| Service Worker | PWA 機能の中核。静的アセットキャッシュとオフライン対応 |
| IndexedDB | ブラウザ内蔵の NoSQL ストレージ。`SaveData` を固定キー `"saveData"` で保存 |

---

## インフラ用語

| 用語 | 定義 |
|------|------|
| ap-northeast-1 | AWS 東京リージョン。本プロジェクトのデフォルト運用リージョン |
| prod ステージ | API Gateway WebSocket の唯一のステージ（本番環境）。dev / staging は持たない |
| `$connect` | API Gateway WebSocket の接続確立ルート |
| `$disconnect` | 接続切断ルート（明示切断・タイムアウト・障害切断含む） |
| `$default` | 上記以外の全メッセージを受けるルート（メッセージ種別は body の `action` で判別） |
| `provided.al2023` | Amazon Linux 2023 ベースの Lambda カスタムランタイム。Go バイナリを `bootstrap` として配置 |
| メンテナンスモード | `DigiRaiseConfig` テーブルの `maintenance_mode = "true"` 状態。`$connect` が一律 503 を返す |
| 緊急遮断 | CloudWatch Alarm 発火時にメンテナンスモードを ON にする自動防御機構 |
| GoneException | API Gateway Management API の例外。送信先接続が既に切れている場合に発生し、本プロジェクトでは正常系として無視 |
| TTL（DynamoDB） | 属性 `ttl` に Unix 秒を入れると自動削除される機能。Connections 1 時間、Rooms 2 時間 |

---

## コード上の命名規則

### フロントエンド（TypeScript / React）

| コード上の名前 | 意味 |
|-------------|------|
| `Creature` | クリーチャー型（`frontend/src/types/creature.ts`） |
| `GameState` | 画面・状態管理の中央型 |
| `SaveData` | 永続化用シリアライズ型（`{ creatures, activeCreatureId }`） |
| `BattleState` | バトル中の状態型（`frontend/src/types/battle.ts`） |
| `useBattleWebSocket` | WebSocket 接続管理フック |
| `useBattleState` | `useReducer` ベースのバトル状態フック |
| `applyTimeUpdate` | ティック更新関数（hunger / happiness / age / HP） |
| `calcDamage` | バトルダメージ計算 |
| `TYPE_ADVANTAGE` | タイプ相性マトリクス定数 |
| `MAX_CREATURES` | クリーチャー保持上限（5） |

### バックエンド（Go）

| コード上の名前 | 意味 |
|-------------|------|
| `ConnectHandler` / `DisconnectHandler` / `MessageHandler` | Lambda ハンドラ本体（`internal/handler/`） |
| `Room` | ルーム操作のドメインオブジェクト（`internal/battle/room.go`） |
| `ConnectionStore` / `RoomStore` / `ConfigStore` | DynamoDB 抽象インターフェース（テストで差し替え可能） |
| `apigw.Client` | API Gateway PostToConnection ラッパー |
| `auth.Verify` | HMAC トークン検証 |
| `Err*`（プレフィックス） | エラー定数（例: `ErrRoomNotFound`, `ErrRateLimited`） |

### DynamoDB スキーマ

| 命名 | ルール | 例 |
|------|-------|-----|
| テーブル名 | `PascalCase`、プレフィックス `DigiRaise` | `DigiRaiseConnections`, `DigiRaiseRooms`, `DigiRaiseConfig` |
| 属性名 | `camelCase` | `connectionId`, `roomCode`, `hostCreature` |
| 主キー | `connectionId` / `roomCode` / `configKey` | テーブル単位で設計 |
| GSI 名 | `[属性]-index` | `roomCode-index` |

---

## 環境変数

| 名前 | 用途 | 既定値 | 設定先 |
|------|------|-------|-------|
| `VITE_WS_ENDPOINT` | フロントエンドが接続する WebSocket URL | — | `frontend/.env` / GitHub Secrets |
| `VITE_WS_SECRET_KEY` | フロントエンド側の HMAC トークン生成用シークレット | — | `frontend/.env` / GitHub Secrets |
| `CONNECTIONS_TABLE` | Connections テーブル名 | `DigiRaiseConnections` | `backend/infra/template.yaml` |
| `ROOMS_TABLE` | Rooms テーブル名 | `DigiRaiseRooms` | 同上 |
| `CONFIG_TABLE` | Config テーブル名 | `DigiRaiseConfig` | 同上 |
| `SECRET_KEY` | バックエンド側 HMAC シークレット | SSM 経由で注入 | SSM Parameter Store `/digi-raise/hmac-secret-key` |
| `AWS_SAM_LOCAL` | SAM Local 実行時に SAM が自動注入（`true`） | （未注入） | SAM Local 内部 |
| `DYNAMODB_ENDPOINT` | ローカル DynamoDB 接続先（任意） | — | `backend/.env`（ローカル開発時のみ） |
| `MSYS_NO_PATHCONV` | Git Bash のパス変換抑制フラグ | — | コマンド先頭で個別指定 |

---

## 略語・頭字語

| 略語 | 正式名称 | 定義 |
|------|---------|------|
| API | Application Programming Interface | アプリケーション間連携の口 |
| SPA | Single Page Application | 単一ページアプリケーション |
| PWA | Progressive Web App | Web 技術でネイティブアプリに近い体験を提供する仕組み |
| WS / WSS | WebSocket / WebSocket Secure | 双方向リアルタイム通信プロトコル |
| TLS | Transport Layer Security | 通信暗号化プロトコル |
| HMAC | Hash-based Message Authentication Code | メッセージ認証コード |
| LCG | Linear Congruential Generator | 線形合同法による疑似乱数生成 |
| TTL | Time To Live | データの有効期限。DynamoDB では Unix 秒で指定 |
| GSI | Global Secondary Index | DynamoDB のグローバルセカンダリインデックス |
| IAM | Identity and Access Management | AWS の権限管理サービス |
| ARN | Amazon Resource Name | AWS リソースを一意に識別する文字列 |
| SSM | Systems Manager（AWS） | パラメータ・シークレット管理 |
| SNS | Simple Notification Service | AWS の通知サービス |
| SAM | Serverless Application Model | AWS のサーバーレス IaC フレームワーク |
| IaC | Infrastructure as Code | インフラのコード化 |
| CDN | Content Delivery Network | コンテンツ配信ネットワーク |
| LCP | Largest Contentful Paint | Web Vitals の主要描画指標（目標 < 2.5s） |
| FID | First Input Delay | 初回入力遅延（目標 < 100ms） |
| INP | Interaction to Next Paint | インタラクション応答性（目標 < 200ms） |
| CRUD | Create / Read / Update / Delete | データ操作の基本 4 種 |
| LCG | Linear Congruential Generator | 線形合同法（疑似乱数） |
| SVG | Scalable Vector Graphics | ベクター画像形式。本プロジェクトではユーザー描画クリーチャーの保存形式 |
| EXP | Experience Points | クリーチャーの経験値 |
| HP | Hit Points | クリーチャーの体力。0 以下で死亡またはバトル敗北 |
| ATK / DEF / SPD | Attack / Defense / Speed | クリーチャーのバトルステータス |

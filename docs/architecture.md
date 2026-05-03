# 技術仕様書

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-05-04 |
| 担当 | バルベルデ（architecture-designer） |

---

## システム概要

| コンポーネント | 役割 |
|--------------|------|
| フロントエンド PWA | クリーチャー育成・進化・お絵描き・バトルロジック実行（ダメージ計算は完結）。ブラウザ単独でも CPU 戦と育成が可能 |
| バックエンド API（Lambda） | WebSocket ルーム管理・乱数シード配信・ターン管理・認証・自動遮断。`creature` データの中身は解釈しない |
| DynamoDB | 接続セッション・ルーム・設定値の管理。TTL で自動クリーンアップ |
| API Gateway WebSocket API | クライアント・Lambda 間のリアルタイム通信、スロットリング |
| SSM Parameter Store | HMAC シークレットの管理 |
| CloudWatch + SNS + 緊急遮断 Lambda | 異常検知時にメンテナンスモードを ON にして接続を全拒否 |
| GitHub Pages + GitHub Actions | フロントエンドのビルド・配信、Secrets から `VITE_*` を注入 |

---

## テクノロジースタック

### フロントエンド

- 言語: TypeScript 5.x（strict mode）
- フレームワーク: React 18
- ビルドツール: Vite 5
- スタイリング: Tailwind CSS v3
- PWA: `vite-plugin-pwa`（Workbox）
- 永続化: IndexedDB（`idb` ライブラリ）
- フォント: Google Fonts — Press Start 2P
- パッケージ管理: npm（lockfile 管理）
- テスト: Vitest + React Testing Library
- Lint / Formatter: ESLint（`max-warnings 0`）

主要ライブラリ:

- `idb` — IndexedDB のラッパー（型安全な CRUD）
- `vite-plugin-pwa` — Service Worker 自動生成・ホーム画面追加対応
- Web Crypto API（標準） — HMAC-SHA256 トークン生成（`frontend/src/utils/wsToken.ts`）
- File System Access API（標準、フォールバックあり） — セーブデータ JSON ファイルのエクスポート/インポート

### バックエンド

- 言語: Go 1.24+
- ランタイム: AWS Lambda `provided.al2023`（カスタムランタイム）
- アーキテクチャ: x86_64
- バイナリ名: `bootstrap`
- ビルドフラグ: `-tags lambda.norpc`（RPC サーバーを除外しコールドスタート短縮）
- パッケージ管理: Go Modules
- テスト: Go 標準 `testing` + インターフェース抽象化によるモック差し替え

主要ライブラリ:

- `github.com/aws/aws-lambda-go` — Lambda ハンドラ
- `github.com/aws/aws-sdk-go-v2` — DynamoDB / API Gateway Management API クライアント
- `github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue` — `json.RawMessage` の透過マーシャリング
- 標準 `crypto/hmac` / `crypto/rand` — HMAC 検証 + 安全な乱数生成

### データベース

- メイン DB: Amazon DynamoDB（オンデマンド請求モード、TTL 有効）
- キャッシュ: なし
- 検索: なし

ローカル開発用に DynamoDB Local（Docker）を併用する。

### 外部 API

- なし（ゲーム単体で完結。第三者 API 呼び出しは行わない）

### インフラ・ホスティング

- フロントエンド配信: GitHub Pages（カスタムドメインなし）
- バックエンド: AWS Lambda + API Gateway WebSocket API
- データベース: Amazon DynamoDB
- シークレット管理: AWS SSM Parameter Store
- 通知: Amazon SNS（CloudWatch Alarm → 緊急遮断 Lambda + メール通知）
- 監視: Amazon CloudWatch Logs / Alarm
- IaC: AWS SAM（`backend/infra/template.yaml`）
- CI/CD: GitHub Actions（`main` push でフロント Pages デプロイ、バックは手動 `make deploy`）

---

## 通信経路

```
ユーザーブラウザ
   │
   │ HTTPS（GET /digi-raise/）
   ▼
GitHub Pages（フロントエンド配信、Service Worker キャッシュ）
   │
   │ WSS（VITE_WS_ENDPOINT、token クエリパラメータ付き）
   ▼
API Gateway WebSocket API
   │  ├─ $connect    ───→ Lambda(connect)
   │  ├─ $disconnect ───→ Lambda(disconnect)
   │  └─ $default    ───→ Lambda(message)
   │
   │ AWS SDK（IAM Role 経由）
   ▼
DynamoDB（Connections / Rooms / Config） + SSM Parameter Store（HMAC 鍵）

[並行経路]
CloudWatch Alarm ─→ SNS Topic ─→ Lambda(emergency-shutdown) ─→ DynamoDB Config
                              └─→ メール通知（オプション）
```

- メイン経路（WebSocket）: 双方向リアルタイム通信が必要なバトルマッチング・ターン進行のため WS を採用
- 補助経路: なし（ヘルスチェック・管理 API は持たず、運用は AWS コンソール / CLI から直接）
- CDN: GitHub Pages の標準 CDN のみ。画像最適化等は行わない

### IAM 権限境界

- Lambda 実行ロール `digi-raise-battle-lambda-role` に DynamoDB CRUD + `execute-api:ManageConnections` + SSM `GetParameter` を付与
- Resource を `arn:aws:dynamodb:*:*:table/DigiRaise*` 等で限定し、関係ないテーブルへのアクセスを禁止
- IAM ユーザーには `IAMFullAccess` を付与しない（カスタム最小権限ポリシーを使用）

---

## 技術的制約と要件

- 対応ブラウザ: Chrome / Safari / Firefox / Edge の最新2バージョン
- 対応デバイス: デスクトップ・モバイル（PWA インストール可能）
- API Gateway WebSocket メッセージサイズ上限:
  - クライアント → サーバー: 32 KB
  - サーバー → クライアント: 128 KB
- Lambda 同時実行数アカウント上限: 50（`ReservedConcurrentExecutions` は設定不可。詳細は `docs/development-guidelines.md` ドメイン別ルール参照）
- Lambda タイムアウト: 10 秒、メモリ 128 MB（コスト最適化）
- WebSocket 接続中は Lambda コンテナを保持しない（接続維持は API Gateway 側）
- バトルロジックはクライアント側完結のため、フロントとバックの **デプロイ順序に注意**:
  - スキーマ変更を伴う場合 → バックエンド先行デプロイ → フロントエンドデプロイ
  - クライアントロジックのみの変更 → フロントエンド単体デプロイで OK

---

## パフォーマンス要件

| 指標 | 目標 | 計測点 |
|------|------|--------|
| LCP（Largest Contentful Paint） | < 2.5 s | Lighthouse / 実機計測 |
| FID / INP | < 100 ms / < 200 ms | 実機計測 |
| WS 往復レイテンシ（同一リージョン） | < 200 ms（平均） | クライアント側ログ |
| バトル中の描画 fps | 60 fps 維持 | DevTools Performance |
| 初回ロード時のバンドルサイズ（gzip） | < 250 KB | `vite build` のサマリ |
| Lambda コールドスタート（connect） | < 500 ms | CloudWatch Logs |
| 同時接続数（通常運用） | 50 以下 | API Gateway メトリクス |

実測値の追跡は `.steering/[YYYYMMDD]-[開発タイトル]/perf-report.md` に各スプリントで記録する。

### コスト目標

| 区分 | 想定使用量 | 月額 |
|------|----------|------|
| API Gateway 接続時間 | 〜90万分/月 | 約 $0.23 |
| API Gateway メッセージ | 〜50万/月 | 無料枠内 |
| Lambda 実行 | 〜6万回/月 | 無料枠内 |
| DynamoDB 書き込み | 〜1万件/月 | 無料枠内 |
| その他（SNS / SSM / CloudWatch） | — | 無料 / 無料枠内 |
| **合計** | — | **約 $0.25 〜 $1 / 月** |

異常時（大量接続攻撃）は CloudWatch Alarm + 自動遮断で月 $10 以内に抑制する。

---

## 開発ツールと手法

| ツール | 用途 |
|--------|------|
| Vite | フロント開発サーバー / プロダクションビルド（`npm run dev`, `npm run build`） |
| Vitest | フロントエンドテスト（`npm run test:run`） |
| ESLint | フロントエンド Lint（`npm run lint`、`max-warnings 0`） |
| TypeScript | 型チェック（`npm run build` 内で `tsc -b`） |
| AWS SAM | バックエンドのビルド・デプロイ（`make build`, `make deploy`） |
| Go test | バックエンドテスト（`make test`） |
| DynamoDB Local（Docker） | ローカルでの DynamoDB 動作検証 |
| `sam local invoke` | Lambda ハンドラのローカル実行（要 `--docker-network backend_default`） |
| GitHub Actions | フロントエンド自動デプロイ（`main` push） |
| クルトワ（security-engineer エージェント） | コミット前のセキュリティレビュー（必須） |

### 開発環境

- Dev Container 標準（`.devcontainer/`）。VS Code / Remote Tunnel 経由で利用
- ホスト OS: Windows 11、Git Bash で AWS CLI / SAM CLI 実行時は `MSYS_NO_PATHCONV=1` + `sam.cmd`
- 詳細は `docs/development-guidelines.md` のドメイン別ルール「インフラ / CI/CD」を参照

---

## セキュリティ方針

### シークレット管理

- HMAC 鍵: AWS SSM Parameter Store `/digi-raise/hmac-secret-key`（SecureString 推奨）
- フロントエンドビルド時の環境変数: `frontend/.env`（`.gitignore` 対象）
  - `VITE_WS_ENDPOINT` / `VITE_WS_SECRET_KEY`
- GitHub Actions: GitHub Secrets から `env:` セクション経由でビルドコンテナへ注入
- ソースコード・ドキュメントには実 URL / 実キーを書かない（`<API_ID>` / `<REDACTED>` プレースホルダ）

### 通信暗号化

- HTTPS / WSS（API Gateway 標準、TLS 1.2 以上）

### 認証

- $connect 時の HMAC-SHA256 トークン検証
  - フォーマット: `{timestamp}.{hmac_hex}`
  - HMAC = `HMAC-SHA256(timestamp, SECRET_KEY)`
  - タイムスタンプは現在時刻 ±60 秒
  - `hmac.Equal()` で定数時間比較（タイミング攻撃対策）
- 制限事項: クライアントサイドに `SECRET_KEY` が露出するため、偶発的アクセス・スクリプトキディ対策レベルと割り切る

### 入力バリデーション・サニタイズ

- WebSocket メッセージ: JSON パース失敗で `INVALID_MESSAGE` を返却
- ルームコード: 6 桁英数字（`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`）以外のフォーマットは拒否
- creature データ: サーバー側で `json.RawMessage` として透過保持し、内容検証はクライアント側に委ねる
- ユーザー描画 SVG: エクスポート時に除外し、表示は信頼境界内（同一オリジン）に限定

### XSS / CSRF / SQL インジェクション対策

- React の自動エスケープに依存（`dangerouslySetInnerHTML` を使わない）
- DynamoDB は SQL ではないためインジェクション対象外
- WebSocket は CORS / Origin 検証に頼れないため、$connect 時の HMAC を主防御線とする

### レート制限・DoS 対策

- 1 接続あたり 60 メッセージ/60 秒、超過で `RATE_LIMITED` を返却
- API Gateway スロットリング: $connect 10 req/sec、$default 200 req/sec
- CloudWatch Alarm + 自動遮断: 接続数 > 500 / Lambda 実行 > 10,000/h でメンテナンスモード ON

### CORS ポリシー

- WebSocket は CORS を持たない（API Gateway 標準）
- フロントエンドは GitHub Pages 配信、API Gateway とは異なるオリジンだが WebSocket 接続には影響なし

### コミット前のセキュリティレビュー

- すべてのコミット前にクルトワ（security-engineer エージェント）のレビューを必須とする
- ハードコーディング検出（実 URL・キー・AWS アカウント情報）を含む
- Critical / High 指摘があれば修正後に再レビュー

---

## 拡張・将来課題

- マルチリージョン展開: 現状単一リージョン運用。レイテンシ要件が厳しくなれば検討
- カスタムドメイン: GitHub Pages のままでも運用可能だが、独自ドメインで PWA インストール体験を改善する余地あり
- マッチング高度化: 現状はルームコード共有のみ。レーティング・ランダムマッチを追加する場合は別エンドポイント／別テーブル設計
- creature データのスキーマ厳格化: 現在はクライアント任せ。チート対策が必要になれば $connect 時に簡易検証を追加（既存設計案あり、`docs/development-guidelines.md` ドメイン別ルール参照）
- 観測性強化: ターン進行の構造化ログ・メトリクス（X-Ray 統合は未検討）
- スケール時の課題: Lambda アカウント上限 50 を超える規模になればクォータ申請、または接続維持型サーバー（ECS）への移行を検討

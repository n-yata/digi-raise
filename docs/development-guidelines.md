# 開発ガイドライン

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-05-04 |
| 担当 | モドリッチ |

---

## コーディング規約

### ハードコーディング禁止

以下はソースコードに直接書かない。違反は **コミット前のクルトワレビューで Critical 指摘**となる。

| 種別 | NG | 集約先 |
|------|-----|-------|
| API キー / シークレット | コードに直接埋め込み・フォールバック値で持つ | `.env`（`.gitignore` 対象）または SSM Parameter Store |
| 外部サービス URL / エンドポイント | コードに直接記述 | `VITE_*` / `os.Getenv` / SSM Parameter Store |
| ホスト・ポート・パス | コードに直接記述 | `.env` または設定ファイル |
| AWS アカウント ID / リソース ARN | コードに直接記述 | 環境変数 + IAM Role 経由 |
| ドキュメント内の機密情報 | 実 URL / 実キーを記載 | プレースホルダ（`<API_ID>`, `<REDACTED>`） |

### TypeScript / JavaScript（フロントエンド）

- 命名規則: コンポーネント `PascalCase`、関数 `camelCase`、定数 `SCREAMING_SNAKE_CASE`、フック `use*`
- 型定義: `any` 禁止。シェイプは `interface`、ユニオン・エイリアスは `type` を使い分け
- import 順序: 標準 → 外部 → 内部（`@/` 等）→ 相対パス
- エラーハンドリング: 例外は境界（イベントハンドラ・WebSocket コールバック）で確実に捕捉。深い階層で握りつぶさない
- Lint / Formatter: ESLint（`max-warnings 0`）。`npm run lint` を CI とローカルで実行
- 型チェック: `npm run build` 内の `tsc -b` を必ず通す

### Go（バックエンド）

- 命名規則: パッケージ名は短く全小文字、エクスポートは `PascalCase`、内部関数は `camelCase`、エラーは `Err*` プレフィックス
- ファイル名: `snake_case.go`（例: `connect.go`, `room.go`）
- エラーハンドリング: 戻り値の `error` は無視せず即座に処理。`errors.Is` / `errors.As` を使用
- インターフェース抽象化: DynamoDB / API Gateway はインターフェースで抽象化し、ハンドラから直接 SDK を呼ばない（テスト容易性確保）
- フォーマッタ: `gofmt`（CI で確認）
- ビルド: `make build`。`-tags lambda.norpc` でコールドスタート短縮

### セキュリティ

- 入力サイズ上限を必ず設ける（DoS 対策）
- ユーザー入力はクライアント側 + サーバー側の二重バリデーション
- React は自動エスケープに依存。`dangerouslySetInnerHTML` は使わない
- カスタム SVG（ユーザー描画）はエクスポート対象から除外し、表示は信頼境界内に限定
- HMAC 比較は必ず `hmac.Equal()`（タイミング攻撃対策）
- ランダム生成は `crypto/rand`（Go） / Web Crypto API（フロント）。`math/rand` は乱数シードのみで使用

---

## Git 規約

### ブランチ戦略

- GitHub Flow ベース。`main` を常時デプロイ可能状態に保つ
- 機能ブランチ: `feature/[簡潔な名前]` / `fix/[名前]` / `chore/[名前]` / `docs/[名前]`
- 個人プロジェクトのため Pull Request 必須化はしないが、大きな変更は PR にして自己レビューを推奨

### コミットメッセージ

- プレフィックス: `feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:` / `style:`（Conventional Commits 緩め適用）
- 1 行サマリは日本語可、50 文字以内目安
- 詳細は本文に書く（"なぜ" を中心に）

### コミット前のセキュリティレビュー

**絶対に守る。** コミット前に必ずクルトワ（security-engineer エージェント）にレビュー依頼すること。

レビュー観点に **必ず** 含めること:

- **URL/エンドポイントのハードコーディング**: API エンドポイント、WebSocket URL、外部サービス URL がソースコードに直接記載されていないか。`VITE_*` / `os.Getenv` / SSM 経由で取得しているか
- **シークレット/キーのハードコーディング**: HMAC キー、API キー、トークン、パスワード等がソース・フォールバック値に埋め込まれていないか
- **AWS アカウント情報**: アカウント ID、リソース ARN、リージョン固有のエンドポイントがハードコードされていないか
- **ドキュメント内の機密情報**: `CLAUDE.md` / `README.md` / `docs/` に実 URL や実キーが記載されていないか。プレースホルダを使っているか
- **OWASP Top 10**: XSS / CSRF / SQL インジェクション / コマンドインジェクション / 認証認可 / 入力バリデーション

Critical / High 指摘があれば修正してからコミット。レビュー結果はシャビへ報告してからコミットへ進む。

### セッション引き継ぎ時の作業原則

**絶対に守る。** セッションが圧縮・引き継がれた場合、「前のセッションで修正済み」というサマリーをそのまま信頼しない。

- 修正済みと記載されていても、作業を始める前に対象ファイルを `Read` ツールで確認してから進む
- 確認せずに「修正済みのはず」として次のステップに進まない
- 特に重要なファイル（セキュリティ関連、CI/CD 設定、`.gitignore`）は必ず直接確認

### Pull Request

- 必須化はしないが、複雑な変更は PR にしてセルフレビュー
- PR テンプレートに「テスト方針」「影響範囲」「ロールバック手順」を含める

---

## テスト規約

### テスト品質

- 実際の機能を検証すること（`expect(true).toBe(true)` のような無意味なアサーション禁止）
- モックは必要最小限。WebSocket / DynamoDB のような外部依存はインターフェース抽象化で差し替える
- 境界値・異常系・エラーケースも必ずテストする
- テストケース名は何を検証しているか明確に記述

### テスト分類

| レイヤ | ツール | 対象 |
|-------|-------|------|
| ユニット（フロント） | Vitest | `utils/` の純粋関数（`battleLogic`, `gameLogic`, `evolution` 等） |
| コンポーネント | Vitest + React Testing Library | UI コンポーネントのレンダリングと相互作用 |
| ユニット（バック） | Go 標準 `testing` | `internal/` の各パッケージ。インターフェースモックで DB / API Gateway を差し替え |
| 統合 | `sam local invoke` + DynamoDB Local | Lambda ハンドラの E2E（ローカル） |
| 手動確認 | ブラウザ実機 | UI / 体感品質 |

### ハードコーディング禁止（テスト）

- テストを通すためだけのハードコードは禁止
- 本番コードに `if (testMode)` のような条件分岐を入れない
- 環境変数や設定ファイルでテスト環境と本番環境を分離する

### 実装前の確認

- 機能の仕様を正しく理解してからテストを書く
- 不明な点があれば、仮の実装ではなくシャビに確認

---

## ナレッジ蓄積ルール

作業中に得た知見・教訓は **発見した瞬間に即座に書き込む**。会話の最後やコミット前にまとめて書くのではない。

### 書き込み先

- 作業中の知見 → 該当 `.steering/[YYYYMMDD]-[開発タイトル]/decisions.md`
- 検証済みの汎用的な知見 → 本ファイル（`docs/development-guidelines.md`）の **ドメイン別ルール** に直接反映
- 横断的なハマりどころ → auto memory（`MEMORY.md`）にも記録

### 即座に書き込むべきタイミング

- バグの根本原因が判明したとき
- 設計判断で選択肢を比較・決定したとき
- セキュリティレビューで指摘が見つかったとき
- 試行錯誤の末に解決策が判明したとき（失敗した試みも含めて）

### 記録すべき判断基準

**記録する**:
- 次回また同じことで迷いそうな判断
- プロジェクト固有の気づきにくい落とし穴
- 試行錯誤の末に判明した解決策（失敗した試みも含めて）
- 効果的だった手法・コマンド

**記録しない**:
- 公式ドキュメントに書いてあること
- コードを読めば自明な内容

---

## 図表・ダイアグラムの記載ルール

### 記載場所

設計図やダイアグラムは、関連する永続的ドキュメント内に直接記載する。
独立した diagrams フォルダは作成せず、メンテナンスコストを最小限に抑える。

### 記述形式

1. **Mermaid 記法（推奨）** — Markdown に直接埋め込め、バージョン管理が容易
2. **ASCII アート** — シンプルな図表に使用
3. **画像ファイル** — 複雑なワイヤフレーム・画面遷移図など。`docs/images/` に drawio / SVG / PNG で配置

### 図表の更新

- 設計変更時は対応する図表も同時に更新
- 図表とコードの乖離を防ぐ（コードを正とする旨を本文に明記する場合あり）

---

## ドメイン別ルール

> 本セクションには、プロジェクト固有のハマりどころ・運用ルールを蓄積する。
> 新しい知見が得られたら **該当ドメインの末尾に追記** する。

---

### ドメイン A: フロントエンド（React + TypeScript + Vite）

#### A-1. 数値が 0 を取り得る変数を truthy/falsy で判定しない

`seed === 0` のような正当な値が **falsy で弾かれる** バグを生みやすい。

```typescript
// NG: seed が 0 だと遷移しない
if (opponent && role && seed && code) { ... }

// OK: null / undefined チェックで判定
if (opponent && role && seed !== null && code) { ... }
```

#### A-2. WebSocket コールバック内で state が古くなる問題

`onmessage` などのコールバックは作成時点の state をクロージャに閉じ込める。最新の state や callback を参照したい場合は `useRef` で保持する。

```typescript
const optionsRef = useRef(options)
useEffect(() => { optionsRef.current = options }, [options])

// コールバック内では常に最新を参照
optionsRef.current.onRoomCreated(roomCode)
```

#### A-3. ref は全ての入口で必ず更新する

非同期処理間で ref を介してデータを共有する場合、**ref を更新する場所を漏らさない**。host の `onRoomCreated` だけでなく、guest の `handleJoinRoom` 等の別ルートでも忘れずにセットする。

#### A-4. イベント到着順序に依存するロジックは危険

WebSocket イベントの到着順序は保証されない。`battle_start` と `opponent_joined` のように両方揃ってから遷移するロジックでは、**両方のハンドラで** 揃いチェック関数（`tryTransitionToBattle()` 等）を呼ぶ。

#### A-5. 三項演算子で props を潰すパターンを避ける

```typescript
// NG: 機能拡張時に見落としやすい
customSvg={isOpponent ? undefined : customSvg}
```

条件付きで props を無効化する場合はコメントで理由を明記し、不要になったら必ず削除する。

#### A-6. バグ調査はデータの流れの最下流（表示コンポーネント）から逆順に辿る

バックエンド → WebSocket → 状態管理 → 表示の順で上流から調べると遠回りになりやすい。`grep` で props 名を検索し、すべての受け渡し箇所を一気に確認するのが最速。

#### A-7. PWA の Service Worker キャッシュが更新を妨げる

開発中にコード変更がブラウザに反映されない場合:

1. DevTools → Application → Service Workers → **Unregister**
2. Application → Storage → **Clear site data**
3. ページをリロード

開発時は Application → Service Workers → **Update on reload** にチェックを入れておくと毎回最新が読まれる。

---

### ドメイン B: バックエンド（Go + AWS Lambda）

#### B-1. `cmd/` は薄いシェル、ロジックは `internal/` に集約

Lambda エントリーポイント（`cmd/[fn]/main.go`）は AWS イベントを `internal/handler` に橋渡しするだけ。ビジネスロジックを直接書かない（ユニットテストが困難になる）。

#### B-2. `json.RawMessage` で透過保持

クリーチャーデータのようにサーバーが解釈する必要がないペイロードは Go の `json.RawMessage` を使う。`attributevalue.MarshalMap` で DynamoDB の Binary (B) 型として保存され、フロントエンドのスキーマ変更に強い。

#### B-3. PostToConnection の GoneException は正常系として無視

相手側の接続が既に切れている場合に発生する `GoneException` はエラーではなく、`apigw.Client` ラッパー内で nil を返す。ハンドラは追加処理しない。

#### B-4. アクション二重送信防止は ConditionExpression で

DynamoDB の `UpdateItem` で `ConditionExpression: status = "battling" AND attribute_not_exists(hostAction|guestAction)` を使い、既に設定済みなら条件不一致で拒否。

#### B-5. Lambda ハンドラのエラー戻り値ルール

| エラー種別 | レスポンス | Lambda 戻り値 |
|-----------|-----------|-------------|
| クライアント起因（認証失敗・不正入力） | StatusCode 4xx | `error: nil` |
| インフラ起因（DynamoDB 障害等） | — | `error: err`（Lambda がリトライ） |
| PostToConnection 先が切断済み | — | 無視（nil 返却） |

`error` を返すと Lambda がリトライするため、リトライさせたいケースだけに限定する。

---

### ドメイン C: データベース（DynamoDB）

#### C-1. TTL は属性 `ttl` を使い、`SpecAttribute` を `ttl` に設定

`DigiRaiseConnections` は `connectedAt + 3600`、`DigiRaiseRooms` は `createdAt + 7200` で自動削除。SAM テンプレートで `TimeToLiveSpecification` を設定。

#### C-2. ルームコード生成は条件付き PutItem + リトライ

6 桁英数字（`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`、紛らわしい I/O/0/1 除外）を `crypto/rand` で生成し、`ConditionExpression: attribute_not_exists(roomCode)` で重複を防ぐ。最大 5 回リトライ。

#### C-3. `roomCode-index` GSI の用途を限定

`Connections.roomCode-index` は **ルーム単位の参加者検索のみ** に使う。ホットパーティション化を防ぐため、ルーム以外の集計には使わない。

---

### ドメイン D: インフラ / CI/CD（AWS SAM + GitHub Actions）

#### D-1. Lambda `ReservedConcurrentExecutions` はアカウント上限に依存

新規 AWS アカウントの Lambda 同時実行上限は **50**（旧 1,000）。`UnreservedConcurrentExecutions` の最低 50 を維持できないため、上限 50 のアカウントでは `ReservedConcurrentExecutions: 1` でもデプロイ失敗する。

```bash
# 現在の上限確認
aws lambda get-account-settings --region ap-northeast-1 \
  --query '{ConcurrentExecutions: AccountLimit.ConcurrentExecutions}'
```

対処: `ReservedConcurrentExecutions` を設定せず、API Gateway スロットリング + CloudWatch Alarm + 自動遮断で制御。上限 50 自体がコスト防御として機能する。

#### D-2. Windows Git Bash での AWS CLI / SAM CLI 実行

Git Bash (MSYS2) がスラッシュで始まる引数を Windows パスに自動変換するため、SSM Parameter 名・S3 パス等が壊れる。

```bash
# NG: /digi-raise/... が C:/Program Files/Git/... に変換される
aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...

# OK: MSYS_NO_PATHCONV=1 を付ける
MSYS_NO_PATHCONV=1 aws ssm put-parameter --name "/digi-raise/hmac-secret-key" ...
```

SAM CLI も同様。Windows では `sam` コマンドが見つからないため `sam.cmd` を使う:

```bash
MSYS_NO_PATHCONV=1 sam.cmd deploy ...
```

Makefile の `sam` 呼び出しは Linux/macOS 向けなので、Windows では直接 `sam.cmd` を叩く。

#### D-3. `AWS::ApiGatewayV2::RouteSettings` というリソースタイプは存在しない

`$connect` のスロットリングは Stage リソースの `RouteSettings` プロパティで設定する:

```yaml
WebSocketStage:
  Type: AWS::ApiGatewayV2::Stage
  Properties:
    DefaultRouteSettings:
      ThrottlingRateLimit: 200
      ThrottlingBurstLimit: 400
    RouteSettings:
      $connect:
        ThrottlingRateLimit: 10
        ThrottlingBurstLimit: 20
```

#### D-4. `IAMFullAccess` は実質 `AdministratorAccess` と同等

`iam:AttachUserPolicy` 権限があると、自分に `AdministratorAccess` を付与できてしまう。SAM デプロイ用ユーザーには `IAMFullAccess` を付けず、Resource を `arn:aws:iam::*:role/digi-raise-battle-*` に限定したカスタムポリシーで最小権限を付与する。IAM ユーザーのポリシー上限は 10 個。

#### D-5. GitHub Actions で Vite 環境変数を注入する

Vite の `VITE_*` はビルド時にバンドル埋め込みされるため、GitHub Actions では Secrets から `env:` 経由で渡す:

```yaml
- name: Build
  run: npm run build
  working-directory: frontend
  env:
    VITE_WS_ENDPOINT: ${{ secrets.VITE_WS_ENDPOINT }}
    VITE_WS_SECRET_KEY: ${{ secrets.VITE_WS_SECRET_KEY }}
```

Secret 登録は `gh secret set VITE_WS_ENDPOINT --repo owner/repo --body "wss://..."` でも可。

#### D-6. `git filter-repo` でシークレットを履歴削除した後の復旧

1. 置換ルールファイル（例: `secret-value==>REDACTED`）を作成
2. `git filter-repo --replace-text replacements.txt --force` 実行
3. **origin が自動削除される** ので再設定: `git remote add origin https://github.com/owner/repo.git`
4. `git push --force origin main`

注意: 全コミット履歴が書き換わるため、共同開発者がいる場合は事前合意必須。書き換え後は全員が `git fetch --all && git reset --hard origin/main`。

#### D-7. SAM Local の `!Ref` がテーブル名に解決されない

`template.yaml` で `!Ref ConnectionsTable` を環境変数に渡すと、SAM Local 実行時に **CloudFormation 論理 ID 文字列（"ConnectionsTable"）** が渡る。

```yaml
# NG: SAM Local では論理 ID 文字列が渡される
CONNECTIONS_TABLE: !Ref ConnectionsTable

# OK: 実テーブル名を直書き
CONNECTIONS_TABLE: DigiRaiseConnections
```

本番デプロイは正しく解決されるが、ローカル実行時は不一致になる。テーブル名は固定なので直書きで実害なし。

#### D-8. SAM Local の `--env-vars` が Windows で機能しない

`sam local invoke --env-vars env.json` がエンコーディング問題等で無視されることがある。`samconfig.toml` の `env_vars` も同様。

対処:
- DynamoDB エンドポイント: `AWS_SAM_LOCAL=true`（SAM が自動注入）で検知してコード内で分岐
- テーブル名: `template.yaml` 環境変数にリテラル直書き
- シークレット: `template.yaml` の `Parameters` デフォルト値を使用

#### D-9. DynamoDB Local へのネットワーク接続

```
[SAM Lambda コンテナ] ---> [digi-raise-dynamodb-local:8000]
        |                           |
        +--- backend_default -------+  (Docker network)
```

- `host.docker.internal:8000` は Windows + Docker Desktop で機能しないことがある
- `--docker-network backend_default` でコンテナ名直接通信が確実
- DynamoDB Local はセットアップコンテナが `local/local` 認証情報で初期化するため、Lambda 側も同じ認証情報を使う

```bash
# 起動順序
docker compose up -d
sam build
node events/gen-token.mjs   # トークン生成（60秒以内に invoke）
sam local invoke ConnectFunction -e events/connect.json --docker-network backend_default
```

---

### ドメイン E: セキュリティ

#### E-1. HMAC 比較は `hmac.Equal()`

文字列比較（`==`）はタイミング攻撃に弱い。Go では必ず `hmac.Equal()` で定数時間比較する。

#### E-2. 切断トークン・再接続トークンは `crypto/rand`

`reconnectToken` は 16 バイト（128 ビット）を `crypto/rand` で生成。`math/rand` は予測可能なので使わない。

#### E-3. エラーメッセージで内部情報を露出しない

再接続失敗時に `roomCode` 等の内部情報を含めない。汎用化したメッセージ（`AUTH_FAILED` 等）を返す。

#### E-4. カスタム SVG（ユーザー描画）の取り扱い

- IndexedDB に保存する `customSprites` は **エクスポート時に除外**（XSS 経路を増やさない）
- 表示は信頼境界内（同一オリジン）に限定
- 進化ステージごとに別々のキーで保存し、衝突を防ぐ

#### E-5. メンテナンスモードは `$connect` の最初にチェック

`maintenance_mode = true` 時は HMAC 検証より前に `503` を返して全接続を拒否する。

---

## 注意事項

- ドキュメントの作成・更新は段階的に行い、各段階で承認を得る（permanent-doc / steering-doc skill 参照）
- `.steering/` のディレクトリ名は `[YYYYMMDD]-[開発タイトル]` で識別可能にする
- 永続的ドキュメントと作業単位のドキュメントを混同しない
- コード変更後は必ずドメイン別ガイドラインに従ったチェックを実施する
- 図表は必要最小限にとどめ、メンテナンスコストを抑える
- 機能追加・修正の手順は `CLAUDE.md` 「機能追加・修正時の絶対ルール」を参照

# リポジトリ構造定義書

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-05-04 |
| 担当 | モドリッチ |

---

## ディレクトリ構成

```
digi-raise/
├── frontend/                     # フロントエンド（React + TypeScript + Vite）
│   ├── src/
│   │   ├── App.tsx               # ルート、画面ルーティング、useState 群による中央状態管理
│   │   ├── main.tsx              # Vite エントリーポイント
│   │   ├── index.css             # グローバルスタイル（Tailwind directives）
│   │   ├── vite-env.d.ts         # Vite 環境変数の型定義
│   │   ├── components/           # 画面・UI コンポーネント
│   │   ├── hooks/                # useBattleState / useBattleWebSocket
│   │   ├── types/                # creature.ts / battle.ts
│   │   ├── utils/                # battleLogic / cpuBattle / evolution / gameLogic / storage / wsToken / floodFill
│   │   └── data/                 # evolutions.ts（進化系統・基礎ステータス）
│   ├── public/                   # 静的アセット（PWA アイコン・manifest）
│   ├── index.html                # エントリー HTML
│   ├── package.json              # 依存関係・npm スクリプト
│   ├── vite.config.ts            # Vite 設定（base: '/digi-raise/'）
│   ├── tsconfig.json             # TypeScript 設定（strict）
│   ├── tailwind.config.js        # Tailwind CSS 設定
│   └── .env.example              # 環境変数のサンプル（実 .env は .gitignore 対象）
├── backend/                      # バックエンド（Go + AWS Lambda）
│   ├── cmd/                      # Lambda エントリーポイント（薄いシェルのみ）
│   │   ├── connect/main.go       # $connect ルート
│   │   ├── disconnect/main.go    # $disconnect ルート
│   │   ├── message/main.go       # $default ルート
│   │   └── emergency-shutdown/main.go  # SNS トリガー（緊急遮断）
│   ├── internal/                 # ビジネスロジック（テスト容易性のため cmd/ から分離）
│   │   ├── handler/              # Lambda ハンドラ本体
│   │   ├── battle/               # ルーム操作・ターン進行ロジック
│   │   ├── db/                   # DynamoDB テーブル別 CRUD（connections / rooms / config）
│   │   ├── apigw/                # API Gateway PostToConnection ラッパー
│   │   └── auth/                 # HMAC トークン検証
│   ├── infra/                    # インフラ定義（IaC）
│   │   ├── template.yaml         # AWS SAM テンプレート
│   │   └── samconfig.toml        # SAM デプロイ設定
│   ├── Makefile                  # ビルド・テスト・デプロイ
│   ├── go.mod
│   ├── go.sum
│   └── .env.example              # ローカル開発用環境変数サンプル
├── docs/                         # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   ├── glossary.md
│   ├── template/                 # 6 ファイルのひな形
│   └── images/                   # 画面遷移図・ワイヤフレーム（drawio / SVG / PNG）
├── .steering/                    # 作業単位のステアリングファイル
│   ├── template/                 # requirements / design / tasklist / decisions のひな形
│   └── [YYYYMMDD]-[開発タイトル]/  # スプリント単位ディレクトリ
├── .github/
│   └── workflows/                # GitHub Actions（フロントエンド自動デプロイ）
├── .claude/                      # Claude Code 設定
│   ├── settings.local.json       # ローカル設定（.gitignore 対象）
│   └── skills/
│       ├── permanent-doc/SKILL.md
│       └── steering-doc/SKILL.md
├── .devcontainer/                # Dev Container 定義（VS Code Remote）
├── .gitignore
├── CLAUDE.md                     # プロジェクト共通開発ルール
└── README.md                     # プロジェクト紹介・遊び方・開発コマンド
```

> 標準テンプレでは `infra/` がルート直下だが、本プロジェクトはバックエンド単独で完結する SAM 構成のため `backend/infra/` 配下に置く。

---

## ディレクトリの役割

| ディレクトリ | 役割 |
|------------|------|
| `frontend/` | React PWA。GitHub Pages にデプロイ |
| `frontend/src/components/` | 画面単位・UI 部品単位の React コンポーネント |
| `frontend/src/hooks/` | 状態管理・副作用をカプセル化したカスタムフック |
| `frontend/src/utils/` | 純粋関数中心のロジック（バトル計算・進化判定・ストレージ等） |
| `frontend/src/data/` | 静的データ（進化系統テーブル等） |
| `frontend/src/types/` | プロジェクト全体で共有する型定義 |
| `backend/` | Go + AWS Lambda。WebSocket バトル基盤 |
| `backend/cmd/` | Lambda エントリーポイント。AWS イベント変換と `internal/handler` 呼び出しに専念 |
| `backend/internal/` | ビジネスロジック。`cmd/` から呼ばれる。ユニットテスト対象 |
| `backend/infra/` | SAM テンプレート・デプロイ設定 |
| `docs/` | 永続的ドキュメント（プロダクト要求・設計・技術仕様・開発ガイドライン・用語集） |
| `docs/template/` | `docs/` ファイル新規作成・大幅改訂時のひな形 |
| `docs/images/` | 画面遷移図・ワイヤフレーム等の図表素材（drawio / SVG / PNG） |
| `.steering/` | 作業単位のステアリングファイル（要求・設計・タスクリスト・決定事項ログ） |
| `.steering/template/` | スプリント単位ドキュメントのひな形 |
| `.github/workflows/` | CI/CD パイプライン定義 |
| `.claude/skills/` | プロジェクト固有の skill 定義（permanent-doc / steering-doc） |
| `.devcontainer/` | Dev Container 定義（標準開発環境） |

---

## ファイル配置ルール

### ドキュメント

- 永続的ドキュメントは `docs/` 直下に配置（6 ファイル固定）
- 作業単位のドキュメントは `.steering/[YYYYMMDD]-[開発タイトル]/` に配置
- 作業中に得た知見は `.steering/.../decisions.md` に記録し、検証後に恒久ルールへ昇格すべきものを `docs/development-guidelines.md` のドメイン別ルールへ反映する
- 図表素材（drawio / SVG / PNG）は `docs/images/` に配置。Mermaid・ASCII で表現できるものは Markdown 内に埋め込み、独立ファイルにはしない

### フロントエンド

- 画面コンポーネントと UI 部品はいずれも `frontend/src/components/` に配置（Atomic Design 等の細分化はしない）
- カスタムフックは `frontend/src/hooks/` に `use*.ts` 命名で配置
- 純粋関数のロジックは `frontend/src/utils/` に配置（テスト容易性確保）
- 型定義は `frontend/src/types/` に配置（コンポーネント固有の型はファイル内に直接書いてよい）
- 静的データは `frontend/src/data/` に配置
- グローバルスタイルは `frontend/src/index.css`（Tailwind directives のみ）
- フロントエンド・バックエンド共有の型は採用していない（`creature` データはサーバー側で `json.RawMessage` 透過保持のため）

### バックエンド

- `cmd/[function]/main.go` は **薄いシェル**（AWS イベントを `internal/handler` に橋渡しするのみ）
- ビジネスロジックは `internal/handler/` 以下と `internal/battle/`、永続化は `internal/db/`、外部接続は `internal/apigw/` `internal/auth/` に責務分離
- DynamoDB 操作は `internal/db/` のみが行い、ハンドラから直接呼び出さない（インターフェース抽象化でテスト可能）

### 機密情報

- `.env` ファイルは必ず `.gitignore` 対象。`.env.example` だけリポジトリにコミット
- 実 URL / 実 API ID / 実 AWS アカウント ID / 実シークレット をソース・ドキュメントに含めない
- ドキュメントではプレースホルダ（`<API_ID>`, `<REGION>`, `<REDACTED>`）を使用

---

## 命名規則

### ステアリングディレクトリ

```
.steering/[YYYYMMDD]-[開発タイトル]/
```

- `YYYYMMDD`: 着手日（例: `20260504`）
- `開発タイトル`: 半角英数字 + ハイフン区切り（例: `add-search-feature`, `fix-auth-bug`）
- 例: `.steering/20260404-battle-feature/`

### ドキュメントファイル

- 永続的ドキュメント: `kebab-case.md`（例: `product-requirements.md`）
- 作業単位ドキュメント: `requirements.md` / `design.md` / `tasklist.md` / `decisions.md` の固定ファイル名
- 旧形式の plan ドキュメントを `.steering/` へ移設する場合は `legacy-*.md` プレフィックス（例: `legacy-plan.md`）

### フロントエンド（TypeScript / React）

| 種別 | 命名 | 例 |
|------|------|-----|
| コンポーネントファイル | `PascalCase.tsx` | `BattleScreen.tsx`, `CreatureSprite.tsx` |
| コンポーネント名 | `PascalCase` | `function BattleScreen()` |
| カスタムフックファイル | `use*.ts` | `useBattleWebSocket.ts` |
| ユーティリティ | `camelCase.ts` | `battleLogic.ts`, `gameLogic.ts` |
| 型ファイル | `camelCase.ts` | `creature.ts`, `battle.ts` |
| 型・インターフェース | `PascalCase` | `Creature`, `BattleState` |
| 関数 | `camelCase` | `applyTimeUpdate`, `calcDamage` |
| 定数 | `SCREAMING_SNAKE_CASE` | `MAX_CREATURES`, `TYPE_ADVANTAGE` |
| 環境変数 | `VITE_*`（フロント露出） | `VITE_WS_ENDPOINT`, `VITE_WS_SECRET_KEY` |

### バックエンド（Go）

| 種別 | 命名 | 例 |
|------|------|-----|
| パッケージ名 | 全小文字、短く | `handler`, `battle`, `apigw` |
| ファイル名 | `snake_case.go` または短い小文字 | `connect.go`, `room.go`, `client.go` |
| エクスポート関数・型 | `PascalCase` | `func (h *MessageHandler) Handle`, `type RoomRecord struct` |
| 非エクスポート | `camelCase` | `verifyToken`, `parsePayload` |
| 定数 | `PascalCase`（Go の慣例） | `const MaintenanceModeKey = "maintenance_mode"` |
| エラー定数 | `Err*` プレフィックス | `ErrRoomNotFound`, `ErrRateLimited` |

### DynamoDB

| 命名 | ルール | 例 |
|------|-------|----|
| テーブル名 | `PascalCase`、プレフィックス `DigiRaise` | `DigiRaiseConnections`, `DigiRaiseRooms`, `DigiRaiseConfig` |
| 属性名 | `camelCase` | `connectionId`, `roomCode`, `hostCreature` |
| GSI 名 | `[属性]-index` | `roomCode-index` |

### AWS リソース

| 種別 | 命名 | 例 |
|------|------|-----|
| Lambda 関数名 | `digi-raise-battle-[役割]` | `digi-raise-battle-connect`, `digi-raise-battle-message` |
| API Gateway | `digi-raise-battle-ws` | — |
| IAM Role | `digi-raise-battle-[role]` | `digi-raise-battle-lambda-role` |
| SSM Parameter | `/digi-raise/[キー]` | `/digi-raise/hmac-secret-key` |
| CloudWatch Alarm | `digi-raise-[症状]` | `digi-raise-connection-spike`, `digi-raise-lambda-spike` |

---

## .gitignore 対象（主なもの）

- 機密ファイル: `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `secrets/`
- ビルド成果物: `dist/`, `build/`, `backend/dist/`, `*.exe`
- 依存関係ディレクトリ: `node_modules/`
- キャッシュ: `.vite/`, `coverage/`, `.cache/`, `tmp/`
- IDE / エディタ設定: `.vscode/`（`settings.json.example` を除く）, `.idea/`, `*.swp`
- OS 固有ファイル: `.DS_Store`, `Thumbs.db`, `desktop.ini`
- Claude Code ローカル設定: `.claude/settings.local.json`（`.claude/skills/` はリポジトリ管理対象）

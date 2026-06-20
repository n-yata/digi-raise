# リポジトリ構造定義書

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-06-20 |
| 担当 | モドリッチ |

---

## ディレクトリ構成

```
digi-raise/
├── src/                          # フロントエンドソース（React + TypeScript）
│   ├── App.tsx                   # ルート、画面ルーティング、useState 群による中央状態管理
│   ├── main.tsx                  # Vite エントリーポイント
│   ├── index.css                 # グローバルスタイル（Tailwind directives）
│   ├── vite-env.d.ts             # Vite 環境変数の型定義
│   ├── components/               # 画面・UI コンポーネント
│   │   ├── creatures/            # クリーチャー描画コンポーネント（CreatureSprite・DefaultCreatureBody・FallbackSilhouette・*Sprites）
│   │   │   ├── parts/            # 共通 SVG パーツ（Eye・Mouth・FlamePlume 等）
│   │   │   └── pixel/            # 32×32 ドット絵スプライト（PixelSprite・getPixelSprite・getEggPixel(卵)・palette）
│   ├── hooks/                    # useBattleState 等のカスタムフック
│   ├── types/                    # creature.ts / battle.ts
│   ├── utils/                    # battleLogic / cpuBattle / evolution / gameLogic / storage
│   └── data/                     # evolutions.ts（進化系統・基礎ステータス）
├── public/                       # 静的アセット（PWA アイコン・manifest）
├── index.html                    # エントリー HTML
├── package.json                  # 依存関係・npm スクリプト
├── vite.config.ts                # Vite 設定（base: '/digi-raise/'）
├── tsconfig.json                 # TypeScript 設定（strict）
├── tailwind.config.js            # Tailwind CSS 設定
├── .env.example                  # 環境変数のサンプル（実 .env は .gitignore 対象）
├── docs/                         # 永続的ドキュメント
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   ├── glossary.md
│   └── images/                   # 画面遷移図・ワイヤフレーム（drawio / SVG / PNG）
├── .steering/                    # 作業単位のステアリングファイル
│   └── [YYYYMMDD]-[開発タイトル]/  # スプリント単位ディレクトリ
├── .github/
│   └── workflows/                # GitHub Actions（フロントエンド自動デプロイ）
├── .claude/                      # Claude Code 設定
│   ├── settings.local.json       # ローカル設定（.gitignore 対象）
│   └── skills/
├── .devcontainer/                # Dev Container 定義（VS Code Remote）
├── .gitignore
├── CLAUDE.md                     # プロジェクト共通開発ルール
└── README.md                     # プロジェクト紹介・遊び方・開発コマンド
```

---

## ディレクトリの役割

| ディレクトリ | 役割 |
|------------|------|
| `src/` | フロントエンドソース。React PWA として GitHub Pages にデプロイ |
| `src/components/` | 画面単位・UI 部品単位の React コンポーネント |
| `src/components/creatures/` | クリーチャー描画専用コンポーネント群（DefaultCreatureBody がタイプ×ステージを SPRITE_DISPATCH でルーティング） |
| `src/components/creatures/parts/` | 共通 SVG パーツ（Eye・Mouth・FlamePlume・WaterFin・Leaf・Bolt・ShadowVeil・Halo） |
| `src/hooks/` | 状態管理・副作用をカプセル化したカスタムフック |
| `src/utils/` | 純粋関数中心のロジック（バトル計算・進化判定・ストレージ等） |
| `src/data/` | 静的データ（進化系統テーブル等） |
| `src/types/` | プロジェクト全体で共有する型定義 |
| `docs/` | 永続的ドキュメント（プロダクト要求・設計・技術仕様・開発ガイドライン・用語集） |
| `docs/images/` | 画面遷移図・ワイヤフレーム等の図表素材（drawio / SVG / PNG） |
| `.steering/` | 作業単位のステアリングファイル（要求・設計・タスクリスト・決定事項ログ） |
| `.github/workflows/` | CI/CD パイプライン定義 |
| `.claude/skills/` | プロジェクト固有の skill 定義 |
| `.devcontainer/` | Dev Container 定義（標準開発環境） |

---

## ファイル配置ルール

### ドキュメント

- 永続的ドキュメントは `docs/` 直下に配置（6 ファイル固定）
- 作業単位のドキュメントは `.steering/[YYYYMMDD]-[開発タイトル]/` に配置
- 作業中に得た知見は `.steering/.../decisions.md` に記録し、検証後に恒久ルールへ昇格すべきものを `docs/development-guidelines.md` のドメイン別ルールへ反映する
- 図表素材（drawio / SVG / PNG）は `docs/images/` に配置。Mermaid・ASCII で表現できるものは Markdown 内に埋め込み、独立ファイルにはしない

### フロントエンド

- 画面コンポーネントと UI 部品はいずれも `src/components/` に配置（Atomic Design 等の細分化はしない）
- カスタムフックは `src/hooks/` に `use*.ts` 命名で配置
- 純粋関数のロジックは `src/utils/` に配置（テスト容易性確保）
- 型定義は `src/types/` に配置（コンポーネント固有の型はファイル内に直接書いてよい）
- 静的データは `src/data/` に配置
- グローバルスタイルは `src/index.css`（Tailwind directives のみ）

### 機密情報

- `.env` ファイルは必ず `.gitignore` 対象。`.env.example` だけリポジトリにコミット
- 実 URL / 実シークレット をソース・ドキュメントに含めない
- ドキュメントではプレースホルダ（`<REDACTED>`）を使用

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

### フロントエンド（TypeScript / React）

| 種別 | 命名 | 例 |
|------|------|-----|
| コンポーネントファイル | `PascalCase.tsx` | `BattleScreen.tsx`, `CreatureSprite.tsx` |
| コンポーネント名 | `PascalCase` | `function BattleScreen()` |
| カスタムフックファイル | `use*.ts` | `useBattleState.ts` |
| ユーティリティ | `camelCase.ts` | `battleLogic.ts`, `gameLogic.ts` |
| 型ファイル | `camelCase.ts` | `creature.ts`, `battle.ts` |
| 型・インターフェース | `PascalCase` | `Creature`, `BattleState` |
| 関数 | `camelCase` | `applyTimeUpdate`, `calcDamage` |
| 定数 | `SCREAMING_SNAKE_CASE` | `MAX_CREATURES`, `TYPE_ADVANTAGE` |

---

## .gitignore 対象（主なもの）

- 機密ファイル: `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `secrets/`
- ビルド成果物: `dist/`, `build/`
- 依存関係ディレクトリ: `node_modules/`
- キャッシュ: `.vite/`, `coverage/`, `.cache/`, `tmp/`
- IDE / エディタ設定: `.vscode/`（`settings.json.example` を除く）, `.idea/`, `*.swp`
- OS 固有ファイル: `.DS_Store`, `Thumbs.db`, `desktop.ini`
- Claude Code ローカル設定: `.claude/settings.local.json`（`.claude/skills/` はリポジトリ管理対象）

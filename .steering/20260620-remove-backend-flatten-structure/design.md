# 設計書: backend削除・frontend構造フラット化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連要求 | `.steering/20260620-remove-backend-flatten-structure/requirements.md` |

---

## 1. 概要

### 設計方針サマリ

- **目的**: 不要な `backend/` を削除し、`frontend/` をルートに移動して構造をシンプルにする
- **方式**: git worktree で feature ブランチを切り、ファイル移動 → 削除 → 設定ファイル更新 → ビルド確認の順で進める
- **最小スコープ厳守**: フロントエンドのコード内容は変更しない。構造の移動と設定更新のみ
- **既存資産は壊さない**: `vite.config.ts` の `base` 設定、`tsconfig.json` の strict 設定、既存コンポーネントは無変更

---

## 2. 移行前後の構造

### Before

```
digi-raise/
├── backend/          ← 削除対象
├── frontend/         ← ここにある全ファイルをルートへ移動
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── ...
├── docs/
├── CLAUDE.md
└── .gitignore        ← backend/.gitignore の内容は既に包含されているか確認
```

### After

```
digi-raise/
├── src/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── docs/
├── CLAUDE.md
└── .gitignore        ← frontend/.gitignore の内容を統合
```

---

## 3. 変更対象ファイル

### 3.1 削除

| 対象 | 内容 |
|------|------|
| `backend/` ディレクトリ全体 | Go Lambda ソース・SAM テンプレート・テスト |
| `frontend/` ディレクトリ（移動後） | 移動完了後に削除 |

### 3.2 移動（frontend/ → ルート）

- `frontend/src/` → `src/`
- `frontend/index.html` → `index.html`
- `frontend/package.json` → `package.json`
- `frontend/package-lock.json` → `package-lock.json`
- `frontend/vite.config.ts` → `vite.config.ts`
- `frontend/tsconfig.json` → `tsconfig.json`
- `frontend/tsconfig.node.json` → `tsconfig.node.json`
- `frontend/tailwind.config.js` → `tailwind.config.js`
- `frontend/postcss.config.js` → `postcss.config.js`
- `frontend/.env.example` → `.env.example`
- `frontend/.env`（存在する場合） → `.env`（gitignore 対象なので手動確認）
- `frontend/public/`（存在する場合） → `public/`

### 3.3 設定ファイルの内容変更

| ファイル | 変更内容 |
|---------|---------|
| `.gitignore`（ルート） | `frontend/.gitignore` の内容を統合（node_modules/, dist/, .env 等）|
| `CLAUDE.md` | 開発コマンド早見表から `cd frontend` を削除 |
| `docs/repository-structure.md` | `frontend/` 記載を削除し、フラット化後の構造に更新 |
| `.github/workflows/*.yml`（存在すれば） | `working-directory: frontend` などの参照を更新 |

### 3.4 内容変更不要（相対パスのため移動後も動作する）

- `vite.config.ts` — 内部の相対パスは変わらない
- `tsconfig.json` — 同上
- `tailwind.config.js` — 同上
- `src/` 配下のコンポーネント群 — 変更なし

---

## 4. 影響範囲

### 4.1 既存機能への影響

| 機能 | 影響 | 緩和策 |
|------|------|------|
| フロントエンド画面全般 | なし（コード変更なし） | ビルド確認で検証 |
| GitHub Pages デプロイ | ワークフローのパス参照が変わる可能性あり | workflows 確認・更新 |
| PWA 動作 | なし（vite.config.ts の base は維持） | ビルド成果物確認 |

---

作成: モドリッチ / 2026-06-20

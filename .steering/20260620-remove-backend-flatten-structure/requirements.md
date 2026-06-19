# 要求書: backend削除・frontend構造フラット化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連スプリント | なし |

---

## 1. 背景

### 1.1 現状

- `backend/` にあった Go Lambda（WebSocket バトル）の AWS リソースを 2026-06-19 に削除済み
- リポジトリには `backend/` ソースが残ったまま（Go Lambda 4本 + SAM テンプレート + テスト）
- フロントエンドは `frontend/` サブディレクトリに配置されており、ルートから `cd frontend` が必要
- オンライン WebSocket バトルは今後も復活させない方針

### 1.2 やりたいこと

- `backend/` ディレクトリを完全削除
- `frontend/` 配下のファイルをリポジトリルートに移動し、`frontend/` ディレクトリを廃止
- 関連ドキュメント（CLAUDE.md・docs/）のパス参照を更新

---

## 2. ゴール

### 2.1 主目的

- 不要な `backend/` ソースを削除してリポジトリをクリーンにする
- ルート直下で `npm run dev` 等が実行できるようにし、`cd frontend` が不要な構造にする

### 2.2 副次目的

- docs/ のディレクトリ構成記載を現実と一致させる
- CLAUDE.md の開発コマンド早見表を簡略化する

---

## 3. スコープ

### 3.1 含むもの

- `backend/` ディレクトリの完全削除
- `frontend/` 配下の全ファイルをリポジトリルートへ移動
- `frontend/` ディレクトリ削除
- `CLAUDE.md` のコマンド早見表更新（`cd frontend` 削除）
- `docs/repository-structure.md` 更新
- `.gitignore` 統合（`frontend/.gitignore` → ルート `.gitignore`）
- `.github/workflows/` 内のパス参照更新（存在する場合）
- ビルド動作確認（`npm run build` 成功）

### 3.2 含まないもの

- フロントエンドの機能変更・リファクタリング
- 新機能追加
- CI/CD パイプラインの再設計

---

## 4. 機能要件

### 4.1 移行後の動作要件

1. リポジトリルートで `npm run dev` が動作する
2. リポジトリルートで `npm run build` が成功する
3. `npm run lint` / `npm run test:run` がルートで実行できる
4. 既存フロントエンド機能がすべて正常に動作する

### 4.2 既存機能の互換要件

- フロントエンドの画面・ゲームロジックは一切変更しない
- `vite.config.ts` の `base: '/digi-raise/'` 設定を維持する

---

## 5. 非機能要件

### 5.1 互換性・依存

- Node.js / npm のバージョンは変更しない
- `package.json` の依存関係は変更しない

### 5.2 セキュリティ

- `.env` は `.gitignore` 対象のまま維持
- シークレット類は移動先でも適切に除外されること

---

## 6. 制約・前提条件

- main 直コミット禁止。worktree で feature ブランチを切って作業する
- コミット前にクルトワ（security-engineer）レビュー必須
- `node_modules/` は移動せず、ルートで `npm install` を再実行する

---

## 7. 受け入れ条件

- [ ] `backend/` ディレクトリが git 履歴から除かれ、ファイルシステム上に存在しない
- [ ] リポジトリルートで `npm run build` が成功する
- [ ] リポジトリルートで `npm run dev` が起動する
- [ ] `frontend/` ディレクトリが存在しない
- [ ] ルート `.gitignore` が旧 `frontend/.gitignore` の内容を包含している
- [ ] クルトワ（security-engineer）レビューで Critical/High なし

---

作成: モドリッチ / 2026-06-20

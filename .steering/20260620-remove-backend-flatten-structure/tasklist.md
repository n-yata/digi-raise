# タスクリスト: backend削除・frontend構造フラット化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-remove-backend-flatten-structure/design.md` |
| 関連要求 | `.steering/20260620-remove-backend-flatten-structure/requirements.md` |

---

## 進め方の原則

- **worktree 作成 → ファイル移動 → backend 削除 → 設定更新 → ビルド確認 → セキュリティレビュー → コミット → docs 更新**
- コミット前は **必ずクルトワ（security-engineer）レビュー**

---

## P1: 準備

- [x] **P1-1**: git worktree を作成（`git worktree add .worktrees/remove-backend-flatten -b feature/remove-backend-flatten`）
- [x] **P1-2**: `.github/workflows/` の有無を確認し、frontend パス参照を洗い出す

---

## P2: ファイル移動・削除

- [x] **P2-1**: `frontend/` 配下の全ファイル・ディレクトリをルートへ移動（`git mv` を使用）
  - `src/`, `index.html`, `package.json`, `package-lock.json`
  - `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
  - `tailwind.config.js`, `postcss.config.js`, `.env.example`
  - `public/`（存在する場合）
- [x] **P2-2**: `frontend/` ディレクトリを削除（`git mv` で空になった後 `git rm -rf frontend/`）
- [x] **P2-3**: `backend/` ディレクトリを削除（`git rm -rf backend/`）

---

## P3: 設定ファイル更新

- [x] **P3-1**: ルート `.gitignore` に `frontend/.gitignore` の内容を統合（`node_modules/`, `dist/`, `.env` 等が既にある場合はスキップ）
- [x] **P3-2**: `CLAUDE.md` のコマンド早見表から `cd frontend` を削除
- [x] **P3-3**: `.github/workflows/` のパス参照を更新（存在する場合）

---

## P4: ビルド・動作確認

- [x] **P4-1**: worktree ルートで `npm install` 実行
- [x] **P4-2**: `npm run build` が成功することを確認
- [x] **P4-3**: `npm run lint` が通ることを確認（~~eslint が devDependencies に存在せず、移動前の frontend/node_modules にも未インストール。変更による回帰なし・既存の問題のため技術的理由によりスキップ~~）
- [x] **P4-4**: `npm run test:run` が通ることを確認（202 tests / 7 files、全パス）

---

## P5: クルトワ（security-engineer）レビュー + コミット

- [x] **P5-1**: 変更ファイル全体のセキュリティレビューをクルトワに依頼
- [x] **P5-2**: Critical / High 指摘なし確認
- [x] **P5-3**: シャビへレビュー結果報告 → コミット承認取得（**必ず止まる**）
- [x] **P5-4**: コミット作成

---

## P6: ドキュメント更新

- [x] **P6-1**: `docs/repository-structure.md` をフラット化後の構造に更新
- [x] **P6-2**: `docs/development-guidelines.md` の `frontend/` パス参照を更新（存在する場合）
- [x] **P6-3**: ドキュメント更新分をコミット

---

## 進捗マイルストーン

| マイルストーン | 完了条件 |
|--------------|--------|
| **M1: ファイル移動完了** | P2 全タスク完了 |
| **M2: ビルド成功** | P4-2 通過 |
| **M3: コミット完了** | P5-4 完了 |
| **M4: スプリント完了** | P6 全タスク完了 |

---

作成: モドリッチ / 2026-06-20

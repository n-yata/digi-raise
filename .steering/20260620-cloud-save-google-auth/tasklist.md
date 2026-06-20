# タスクリスト: クラウドセーブ × Google アカウント連携

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連設計 | `.steering/20260620-cloud-save-google-auth/design.md` |
| 関連要求 | `.steering/20260620-cloud-save-google-auth/requirements.md` |

---

## 進め方の原則

- **環境準備 → サービス層 → フック → UI → 削除 → CI/Rules → 検証 → セキュリティレビュー → ドキュメント**
- 各タスクは [ ] 未着手 / [x] 完了 で管理
- ハードコード禁止（Firebase Config はすべて `VITE_FIREBASE_*` 環境変数経由）
- コミット前は **必ずクルトワ（security-engineer）レビュー**
- **完了報告は出すが作業を止めない。シャビ判断が必要な事項が発生したときのみ止まる**

---

## P1: 環境準備

- [x] **P1-1**: `npm install firebase` で Firebase SDK v9 を追加
- [x] **P1-2**: `.env.example` に `VITE_FIREBASE_*` 6件を追記
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- [ ] **P1-3**: ローカル開発用 `.env` に実値を記入（シャビが手動で作成）
- [x] **P1-4**: `.gitignore` に `.env` が含まれていることを確認（確認済み）

---

## P2: サービス層実装

### P2-A: Firebase 初期化（`src/services/firebase.ts`）

- [x] **P2-A-1**: `src/services/` ディレクトリを作成
- [x] **P2-A-2**: `firebase.ts` を新規作成
  - `VITE_FIREBASE_*` 環境変数から config を読み込む
  - Config 未設定時は `null` を返すフォールバック（クラウド機能まるごと無効化）
  - `getFirebaseAuth()` / `getFirestoreDb()` を動的ロード（dynamic import）で提供

### P2-B: クラウドセーブロジック（`src/services/cloudSave.ts`）

- [x] **P2-B-1**: `src/utils/storage.ts` の `validateSaveData` / `validateCreature` に `export` を付与
- [x] **P2-B-2**: `cloudSave.ts` を新規作成
- [x] **P2-B-3**: `resolveConflict` / `getLocalUpdatedAt` の単体テストを追加（`src/services/__tests__/cloudSave.test.ts`）

---

## P3: フック実装

### P3-A: 認証フック（`src/hooks/useAuth.ts`）

- [x] **P3-A-1**: `useAuth.ts` を新規作成
  - `AuthState` 型: `loading` / `signedOut` / `signingIn` / `signedIn` / `error`
  - `getRedirectResult()` で起動時のリダイレクト復帰を処理
  - `onAuthStateChanged` で認証状態を購読
  - `signIn()`: `signInWithRedirect(GoogleAuthProvider)`
  - `signOut()`: Firebase からサインアウト

### P3-B: クラウド同期フック（`src/hooks/useCloudSave.ts`）

- [x] **P3-B-1**: `useCloudSave.ts` を新規作成
  - サインイン確定時に `pullFromCloud` → `resolveConflict` → 必要なら state 反映 & `pushToCloud`
  - `saveData` 変更をデバウンス 3 秒で `pushToCloud` に流す
  - `SyncStatus` 型: `idle` / `syncing` / `synced` / `error` を公開
  - `lastSyncedAt` を公開

---

## P4: UI 実装

- [ ] **P4-1**: `src/components/AuthButton.tsx` を新規作成
  - 未サインイン: 「Googleでサインイン」ボタン
  - サインイン済み: アカウント名 + 同期ステータス（最終同期日時 / 同期中 / エラー）+ サインアウトボタン
  - ヘッダーに配置することを前提とした軽量コンポーネント
- [x] **P4-2**: `src/App.tsx` に `useAuth` / `useCloudSave` を統合

---

## P5: ファイルエクスポート / インポート機能削除

- [x] **P5-1**: `src/utils/storage.ts` から削除
  - `MAX_FILE_SIZE` 定数
  - `exportSave()` 関数
  - `importSave()` 関数
  - `parseSaveFile()` 関数
- [x] **P5-2**: `src/components/StatusScreen.tsx` から削除
  - `exportSave` / `importSave` の import
  - `handleExport` / `handleImport` ハンドラ
  - 「セーブデータ出力」「セーブデータ読込」ボタン UI
  - `onLoad` prop（型定義・分解）
- [x] **P5-3**: `src/App.tsx` の `onLoad` 受け渡し削除

---

## P6: CI / Security Rules

- [x] **P6-1**: `.github/workflows/deploy.yml` の Build ステップに `env:` を追加
  ```yaml
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
  ```
- [x] **P6-2**: `firestore.rules` をリポジトリルートに新規作成
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null
                           && request.auth.uid == userId;
      }
    }
  }
  ```
- [ ] **P6-3**: Firebase Console で Security Rules を反映（手動）

---

## P7: 検証

- [ ] **P7-1**: `npm run build` 成功・バンドルサイズ増加 +50KB gzip 以内を確認
- [ ] **P7-2**: `npm run lint` エラーなし
- [ ] **P7-3**: `npm run test:run` 全テスト通過（`resolveConflict` テスト含む）
- [ ] **P7-4**: ローカルで未サインイン状態のまま従来通りプレイできることを確認
- [ ] **P7-5**: Google サインイン → Firestore にデータが書き込まれることを確認
- [ ] **P7-6**: 別ブラウザ（同アカウント）でサインインしてデータが引き継がれることを確認

---

## P8: クルトワ（security-engineer）レビュー + コミット

- [x] **P8-1**: 変更ファイルすべてのセキュリティレビューをクルトワに依頼
  - `VITE_FIREBASE_*` のハードコーディングがないこと
  - `firestore.rules` の認証・所有者検証
  - クラウド受信データの `validateSaveData` 検証
  - XSS・インジェクション
- [x] **P8-2**: High-1（lastSyncedAt 検証欠落）を修正済み。Critical なし
- [x] **P8-3**: シャビへレビュー結果報告 → コミット承認取得済み
- [ ] **P8-4**: コミット作成・PR 作成・マージ

---

## P9: ドキュメント更新

- [ ] **P9-1**: `docs/architecture.md` に Firebase（Auth + Firestore）をスタック・通信経路として追記
- [ ] **P9-2**: `docs/functional-design.md` にクラウドセーブのシーケンス図・Firestore パス・データ構造を反映
- [ ] **P9-3**: `docs/glossary.md` に「クラウドセーブ」「`lastSyncedAt`」等を追加

---

## 進捗マイルストーン

| マイルストーン | 完了条件 |
|--------------|---------|
| **M1: 環境準備完了** | P1 全完了・`firebase` 依存追加 |
| **M2: サービス層完成** | P2 全完了・単体テスト通過 |
| **M3: 統合動作** | P3〜P5 完了・ローカルでサインイン〜同期が動作 |
| **M4: CI 対応完了** | P6 完了・GitHub Actions でビルド成功 |
| **M5: コミット完了** | P8 完了・PR マージ |
| **M6: スプリント完了** | P9 完了 |

---

作成: モドリッチ / 2026-06-20

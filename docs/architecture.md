# 技術仕様書

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-06-20 |
| 担当 | バルベルデ（architecture-designer） |

---

## システム概要

| コンポーネント | 役割 |
|--------------|------|
| フロントエンド PWA | クリーチャー育成・進化・お絵描き・バトルロジック実行（ダメージ計算完結）。ブラウザ単独で CPU 戦・育成が可能 |
| GitHub Pages + GitHub Actions | フロントエンドのビルド・配信 |

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
- File System Access API（標準、フォールバックあり） — セーブデータ JSON ファイルのエクスポート/インポート

クリーチャー描画アーキテクチャ:

```
CreatureSprite
  ├── stage === 0 → EggBody（卵 CSS描画）
  └── stage 1-5  → DefaultCreatureBody
                      ├── SPRITE_DISPATCH[type][stage] が定義済み → 各タイプスプライト（FireSprites 等）
                      └── 未定義 → FallbackSilhouette（タイプカラーの楕円 + 表情パーツ）
```

- スプライトは viewBox `0 0 100 100` に統一し、`size` prop でスケーリング
- 色は `TYPE_COLORS[type]` のみ使用（SVG 内ハードコード禁止）
- ユーザー描画（`customSvg`）は `CreatureSprite` で最優先表示し、標準スプライトを上書き

### インフラ・ホスティング

- フロントエンド配信: GitHub Pages（カスタムドメインなし）
- CI/CD: GitHub Actions（`main` push でフロント Pages デプロイ）

---

## 通信経路

```
ユーザーブラウザ
   │
   │ HTTPS（GET /digi-raise/）
   ▼
GitHub Pages（フロントエンド配信、Service Worker キャッシュ）
```

- すべてのゲームロジック（育成・バトル）はフロントエンド完結
- CDN: GitHub Pages の標準 CDN のみ

---

## 技術的制約と要件

- 対応ブラウザ: Chrome / Safari / Firefox / Edge の最新2バージョン
- 対応デバイス: デスクトップ・モバイル（PWA インストール可能）

---

## パフォーマンス要件

| 指標 | 目標 | 計測点 |
|------|------|--------|
| LCP（Largest Contentful Paint） | < 2.5 s | Lighthouse / 実機計測 |
| FID / INP | < 100 ms / < 200 ms | 実機計測 |
| バトル中の描画 fps | 60 fps 維持 | DevTools Performance |
| 初回ロード時のバンドルサイズ（gzip） | < 250 KB | `vite build` のサマリ |

---

## 開発ツールと手法

| ツール | 用途 |
|--------|------|
| Vite | フロント開発サーバー / プロダクションビルド（`npm run dev`, `npm run build`） |
| Vitest | フロントエンドテスト（`npm run test:run`） |
| ESLint | フロントエンド Lint（`npm run lint`、`max-warnings 0`） |
| TypeScript | 型チェック（`npm run build` 内で `tsc -b`） |
| GitHub Actions | フロントエンド自動デプロイ（`main` push） |
| クルトワ（security-engineer エージェント） | コミット前のセキュリティレビュー（必須） |

### 開発環境

- Dev Container 標準（`.devcontainer/`）。VS Code / Remote Tunnel 経由で利用

---

## セキュリティ方針

### シークレット管理

- フロントエンドビルド時の環境変数: `.env`（`.gitignore` 対象、ルート直下）
- ソースコード・ドキュメントには実 URL / 実キーを書かない

### 通信暗号化

- HTTPS（GitHub Pages 標準）

### XSS 対策

- React の自動エスケープを基本とする
- `dangerouslySetInnerHTML` は現時点のコードベースでは未使用（`customSvg` は `ReactNode` として JSX 描画）。将来使用する場合は必ず `DOMPurify.sanitize({ USE_PROFILES: { svg: true } })` を通す
- カスタム SVG（ユーザー描画）はエクスポート時に除外し、表示は信頼境界内（同一オリジン）に限定

### コミット前のセキュリティレビュー

- すべてのコミット前にクルトワ（security-engineer エージェント）のレビューを必須とする
- Critical / High 指摘があれば修正後に再レビュー

---

## 拡張・将来課題

- カスタムドメイン: GitHub Pages のままでも運用可能だが、独自ドメインで PWA インストール体験を改善する余地あり
- オンラインバトル: WebSocket バックエンド（Go + AWS Lambda）は削除済み。再実装する場合はバックエンド設計から着手が必要

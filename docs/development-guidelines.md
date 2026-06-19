# 開発ガイドライン

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-06-20 |
| 担当 | モドリッチ |

---

## コーディング規約

### ハードコーディング禁止

以下はソースコードに直接書かない。違反は **コミット前のクルトワレビューで Critical 指摘**となる。

| 種別 | NG | 集約先 |
|------|-----|-------|
| API キー / シークレット | コードに直接埋め込み・フォールバック値で持つ | `.env`（`.gitignore` 対象） |
| 外部サービス URL / エンドポイント | コードに直接記述 | `VITE_*` / 設定ファイル |
| ドキュメント内の機密情報 | 実 URL / 実キーを記載 | プレースホルダ（`<API_ID>`, `<REDACTED>`） |

### TypeScript / JavaScript（フロントエンド）

- 命名規則: コンポーネント `PascalCase`、関数 `camelCase`、定数 `SCREAMING_SNAKE_CASE`、フック `use*`
- 型定義: `any` 禁止。シェイプは `interface`、ユニオン・エイリアスは `type` を使い分け
- import 順序: 標準 → 外部 → 内部（`@/` 等）→ 相対パス
- エラーハンドリング: 例外は境界（イベントハンドラ）で確実に捕捉。深い階層で握りつぶさない
- Lint / Formatter: ESLint（`max-warnings 0`）。`npm run lint` を CI とローカルで実行
- 型チェック: `npm run build` 内の `tsc -b` を必ず通す

### セキュリティ

- React の自動エスケープを基本とする
- `dangerouslySetInnerHTML` は現時点未使用（`customSvg` は `ReactNode` として JSX 描画）。将来使用する場合は必ず `DOMPurify.sanitize({ USE_PROFILES: { svg: true } })` を通す（詳細は C-2 参照）
- カスタム SVG（ユーザー描画）はエクスポート対象から除外し、表示は信頼境界内に限定

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

- **URL/エンドポイントのハードコーディング**: 外部サービス URL がソースコードに直接記載されていないか
- **シークレット/キーのハードコーディング**: API キー、トークン等がソース・フォールバック値に埋め込まれていないか
- **ドキュメント内の機密情報**: `CLAUDE.md` / `README.md` / `docs/` に実 URL や実キーが記載されていないか。プレースホルダを使っているか
- **OWASP Top 10**: XSS / CSRF / コマンドインジェクション / 入力バリデーション

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
- モックは必要最小限
- 境界値・異常系・エラーケースも必ずテストする
- テストケース名は何を検証しているか明確に記述

### テスト分類

| レイヤ | ツール | 対象 |
|-------|-------|------|
| ユニット | Vitest | `utils/` の純粋関数（`battleLogic`, `gameLogic`, `evolution` 等） |
| コンポーネント | Vitest + React Testing Library | UI コンポーネントのレンダリングと相互作用 |
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

#### A-2. コールバック内で state が古くなる問題

`onmessage` などのコールバックは作成時点の state をクロージャに閉じ込める。最新の state や callback を参照したい場合は `useRef` で保持する。

```typescript
const optionsRef = useRef(options)
useEffect(() => { optionsRef.current = options }, [options])

// コールバック内では常に最新を参照
optionsRef.current.onRoomCreated(roomCode)
```

#### A-3. ref は全ての入口で必ず更新する

非同期処理間で ref を介してデータを共有する場合、**ref を更新する場所を漏らさない**。host の `onRoomCreated` だけでなく、guest の `handleJoinRoom` 等の別ルートでも忘れずにセットする。

#### A-4. 三項演算子で props を潰すパターンを避ける

```typescript
// NG: 機能拡張時に見落としやすい
customSvg={isOpponent ? undefined : customSvg}
```

条件付きで props を無効化する場合はコメントで理由を明記し、不要になったら必ず削除する。

#### A-5. バグ調査はデータの流れの最下流（表示コンポーネント）から逆順に辿る

状態管理 → 表示の順で上流から調べると遠回りになりやすい。`grep` で props 名を検索し、すべての受け渡し箇所を一気に確認するのが最速。

#### A-6. PWA の Service Worker キャッシュが更新を妨げる

開発中にコード変更がブラウザに反映されない場合:

1. DevTools → Application → Service Workers → **Unregister**
2. Application → Storage → **Clear site data**
3. ページをリロード

開発時は Application → Service Workers → **Update on reload** にチェックを入れておくと毎回最新が読まれる。

---

### ドメイン B: インフラ / CI/CD（GitHub Actions）

#### B-1. GitHub Actions で Vite 環境変数を注入する

Vite の `VITE_*` はビルド時にバンドル埋め込みされるため、GitHub Actions では Secrets から `env:` 経由で渡す:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_EXAMPLE: ${{ secrets.VITE_EXAMPLE }}
```

#### B-2. `git filter-repo` でシークレットを履歴削除した後の復旧

1. 置換ルールファイル（例: `secret-value==>REDACTED`）を作成
2. `git filter-repo --replace-text replacements.txt --force` 実行
3. **origin が自動削除される** ので再設定: `git remote add origin https://github.com/owner/repo.git`
4. `git push --force origin main`

注意: 全コミット履歴が書き換わるため、共同開発者がいる場合は事前合意必須。書き換え後は全員が `git fetch --all && git reset --hard origin/main`。

---

### ドメイン C: セキュリティ

#### C-0. クリーチャー標準 SVG の見た目言語（ハードコード禁止）

- **viewBox は `0 0 100 100` に統一**（`CreatureSprite` が `size` prop でスケーリングするため、内部座標は固定）
- **線幅は `strokeWidth="3"〜`5`（viewBox 100 基準の 3-5%）**
- **塗り色は必ず `TYPE_COLORS[type]` 経由**でプロップとして受け取る。SVG 内にカラーコードを直接書かない
- **アウトライン色は `SVG_OUTLINE_COLOR`（`spriteConfig.ts`）のみ**。他の定数・リテラルを使わない
- **グラデーション・フィルター禁止**（`<linearGradient>` `<filter>` 等は使用しない）
- **`<script>` `<foreignObject>` 等の危険要素禁止**（XSS 経路を生まない）
- **各スプライトの SVG ノード数は 30 以下**を目安にシンプルに保つ
- タイプアイコン（`TypeIcon`）は viewBox `0 0 24 24` 統一。パスは `typeIconPaths.ts` の `TYPE_ICON_PATHS` に集約し、コンポーネント内にハードコードしない

#### C-1. カスタム SVG（ユーザー描画）の取り扱い

- IndexedDB に保存する `customSprites` は **エクスポート時に除外**（XSS 経路を増やさない）
- 表示は信頼境界内（同一オリジン）に限定
- 進化ステージごとに別々のキーで保存し、衝突を防ぐ

#### C-2. `dangerouslySetInnerHTML` と DOMPurify（将来実装時のガイド）

現時点のコードでは `dangerouslySetInnerHTML` は未使用（`customSvg` は `ReactNode` として JSX 描画）。WebSocket バックエンド削除により外部 SVG の受信経路も消滅。将来 `dangerouslySetInnerHTML` を導入する際は以下を守ること:

- 使用箇所は **必ず** `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true }, FORBID_TAGS: ['foreignObject'] })` を通す
- 自分のクリーチャー（IndexedDB 由来）と外部データ由来で、サニタイズのライフサイクルが非対称になりやすい。外部経路のデータは受け取り直後にサニタイズする（入口で処理）
- `customSvg` を扱う経路が複数になる場合は、型レベルで「サニタイズ済み」を保証するラッパーの導入を検討する

---

## 注意事項

- ドキュメントの作成・更新は段階的に行い、各段階で承認を得る（permanent-doc / steering-doc skill 参照）
- `.steering/` のディレクトリ名は `[YYYYMMDD]-[開発タイトル]` で識別可能にする
- 永続的ドキュメントと作業単位のドキュメントを混同しない
- コード変更後は必ずドメイン別ガイドラインに従ったチェックを実施する
- 図表は必要最小限にとどめ、メンテナンスコストを抑える
- 機能追加・修正の手順は `CLAUDE.md` 「機能追加・修正時の絶対ルール」を参照

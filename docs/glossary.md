# ユビキタス言語定義

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-05-04 |
| 最終更新 | 2026-06-19 |
| 担当 | モドリッチ |

> プロジェクトで使用する用語の統一定義。
> コード上の命名・ドキュメント・チャットでの議論すべてで本書に従う。
> 新しい用語が出てきたら **該当カテゴリの末尾に追記** する。

---

## ドメイン用語（ゲーム）

| 用語 | 英語 | 定義 |
|------|------|------|
| クリーチャー | Creature | プレイヤーが育成する個体。1 セーブデータに最大 5 体（墓石含む） |
| アクティブクリーチャー | Active Creature | 現在操作・時間進行している 1 体。バトルに自動参加 |
| 墓石 | Tombstone | `isAlive: false` の死亡したクリーチャー。リストに残り閲覧可能だが操作不可 |
| 進化ステージ | Evolution Stage | クリーチャーの成長段階。0〜5 の整数で管理 |
| タマゴ | Egg | 進化ステージ 0。タップで即時ベイビーに進化 |
| ベイビー | Baby | 進化ステージ 1 |
| チャイルド | Child | 進化ステージ 2。`age ≥ 0.5`（日）で進化 |
| アダルト | Adult | 進化ステージ 3。`age ≥ 1` AND `happiness ≥ 50` で進化 |
| パーフェクト | Perfect | 進化ステージ 4。`age ≥ 3` AND `level ≥ 8` AND `atk + def + spd ≥ 40` で進化 |
| アルティメット | Ultimate | 進化ステージ 5（最終）。`age ≥ 7` AND `level ≥ 14` AND 各ステータス `≥ 20` で進化 |
| ブランチ | Branch | クリーチャーの育ち方による系統。善(A)・悪(B)・中間(C)・none（未分岐）の4種。幸福度によって決まる |
| 善（A系） | Branch A | しあわせ度が高い育て方で分岐する神聖テーマの系統。カラー: #ffd700 |
| 悪（B系） | Branch B | しあわせ度が低い放置気味の育て方で分岐する禍々しいテーマの系統。カラー: #9b59b6 |
| 中間（C系） | Branch C | しあわせ度が中間的な育て方で分岐するクールテーマの系統。カラー: #3498db |
| 終点クリーチャー | Terminal Creature | `evolvesTo: []` を持ちアルティメットへ進化しないクリーチャー。perfectA2/B2/C2 の3体 |
| ティック | Tick | 時間更新の最小単位。通常モード 30 分、devMode 30 秒 |
| age | age | クリーチャー年齢（float、単位は日）。現実 1 日で +1 歳（1 ティックごとに +1/48）。表示は `Math.floor(age)` 歳 |
| 満腹度 | Hunger | 0〜100。**時間経過のみ**で減少（約8時間で空腹＝1日3回の食事ペース）。0 で餓死ダメージ、100 でこれ以上食べられない |
| しあわせ度 | Happiness | 0〜100。進化条件・あそぶで上昇、時間経過で減少 |
| 疲労度 | Fatigue | 0〜100 の**裏パラメータ**（UI非表示）。トレ +15 / あそぶ +10 で蓄積、時間経過で常時回復（約3時間で全回復）。`≥ 100` でトレ・あそぶ不可、`≥ 60` で「疲労中」モーション |
| えさ / ごはん | Feed | 育成アクションの 1 つ。hunger +30、happiness +5。EXP 付与なし |
| トレーニング | Training | 育成アクション。もぐらたたきミニゲーム（3×3、8 秒、5 匹以上で成功）。fatigue +15（おなかは消費しない） |
| あそぶ | Play | 育成アクション。神経衰弱ミニゲーム（2×3、3 ペア、8 手以内で成功）。EXP 付与なし。fatigue +10（おなかは消費しない） |
| ねる | Sleep | 睡眠状態をトグル。1 ティックごとに HP +ceil(maxHp × 0.1) |
| 特殊アクション | Special | バトルアクションの 1 つ。タイプ別効果、クールダウン 2 ターン |
| タイプ相性 | Type Advantage | タイプ間のダメージ補正（×0.8 / ×1.0 / ×1.2）。正本は `frontend/src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` |
| 連撃 | Multi-Hit | Fire の特殊効果。連続 2 回攻撃（各ダメージ ×0.7） |
| 毒 | Poison | Plant の特殊効果。3 ターンの間、毎ターン最大 HP × 3% ダメージ |
| 麻痺 | Paralysis | Thunder の特殊効果。次ターン行動不可（50% 確率） |
| 防御バフ | Defense Buff | Light の特殊効果。自 DEF × 1.5、2 ターン継続 |
| devMode | — | 時間スケール加速モード（30 分 → 30 秒）。メイン画面ヘッダー「DEV」ボタンで切替 |
| お絵描き | Drawing | 進化のたびに表示される 64×64 ピクセルアートキャンバス。SVG として保存 |
| シルエット継承 | Silhouette Inheritance | 進化ステージを重ねるにつれて「特徴パーツ」が大きく/複雑になる表現方針。例: FireBaby の小さな炎が FireUltimate では全身を覆う。低ステージの造形を上位ステージが包含することで「育てた感」を演出する |
| 特徴パーツ | Feature Part | タイプの個性を表す SVG パーツコンポーネント（FlamePlume・WaterFin・Leaf・Bolt・ShadowVeil・Halo 等）。`parts/` ディレクトリに配置し、各タイプのスプライトから scale/位置を変えて使い回す |
| スプライトディスパッチ | Sprite Dispatch | `pixel/index.ts` の `getPixelSprite(creatureId)` がスプライトデータを返す。現在は全件 null（FallbackSilhouette にフォールバック）。スプライト差し替えは次スプリント以降 |
| CPU バトル | CPU Battle | フロントエンド完結のオフライン対戦。CPU はランダムにアクション選択 |

---

## ソフトウェア用語

| 用語 | 役割・用途 |
|------|----------|
| React 18 | フロントエンド UI フレームワーク |
| TypeScript 5.x | フロント言語（strict mode） |
| Vite 5 | フロント開発サーバー / ビルドツール |
| Tailwind CSS v3 | ユーティリティファースト CSS |
| vite-plugin-pwa | Service Worker / Manifest 自動生成（Workbox 利用） |
| idb | IndexedDB の型安全ラッパー |
| Vitest | フロントエンドテストランナー |
| ESLint | フロントエンド Lint（`max-warnings 0`） |
| Press Start 2P | レトロゲーム調フォント（Google Fonts） |
| GitHub Pages | フロントエンドの静的配信 |
| GitHub Actions | CI/CD パイプライン |
| LCG | Linear Congruential Generator。バトル乱数の生成方式（`state = (state * 1664525 + 1013904223) & 0xFFFFFFFF`） |
| Service Worker | PWA 機能の中核。静的アセットキャッシュとオフライン対応 |
| IndexedDB | ブラウザ内蔵の NoSQL ストレージ。`SaveData` を固定キー `"saveData"` で保存 |

---

## コード上の命名規則

### フロントエンド（TypeScript / React）

| コード上の名前 | 意味 |
|-------------|------|
| `Creature` | クリーチャー型（`src/types/creature.ts`） |
| `CreatureId` | 進化ツリー上の識別子型。egg/baby/childA〜ultimateC の20種 |
| `CreatureBranch` | ブランチ型。`'A' \| 'B' \| 'C' \| 'none'` |
| `CREATURE_TREE` | 全20体の進化定義マップ（`src/data/evolutions.ts`） |
| `GameState` | 画面・状態管理の中央型 |
| `SaveData` | 永続化用シリアライズ型（`{ creatures, activeCreatureId }`） |
| `BattleState` | バトル中の状態型（`frontend/src/types/battle.ts`） |
| `useBattleState` | `useReducer` ベースのバトル状態フック |
| `applyTimeUpdate` | ティック更新関数（hunger / happiness / age / fatigue / HP） |
| `calcDamage` | バトルダメージ計算 |
| `TYPE_ADVANTAGE` | タイプ相性マトリクス定数 |
| `MAX_CREATURES` | クリーチャー保持上限（5） |

---

## 略語・頭字語

| 略語 | 正式名称 | 定義 |
|------|---------|------|
| API | Application Programming Interface | アプリケーション間連携の口 |
| SPA | Single Page Application | 単一ページアプリケーション |
| PWA | Progressive Web App | Web 技術でネイティブアプリに近い体験を提供する仕組み |
| TLS | Transport Layer Security | 通信暗号化プロトコル |
| LCG | Linear Congruential Generator | 線形合同法による疑似乱数生成 |
| CDN | Content Delivery Network | コンテンツ配信ネットワーク |
| LCP | Largest Contentful Paint | Web Vitals の主要描画指標（目標 < 2.5s） |
| FID | First Input Delay | 初回入力遅延（目標 < 100ms） |
| INP | Interaction to Next Paint | インタラクション応答性（目標 < 200ms） |
| CRUD | Create / Read / Update / Delete | データ操作の基本 4 種 |
| SVG | Scalable Vector Graphics | ベクター画像形式。本プロジェクトではユーザー描画クリーチャーの保存形式 |
| EXP | Experience Points | クリーチャーの経験値 |
| HP | Hit Points | クリーチャーの体力。0 以下で死亡またはバトル敗北 |
| ATK / DEF / SPD | Attack / Defense / Speed | クリーチャーのバトルステータス |

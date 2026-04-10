# デジレイズ (DigiRaise) フロントエンド仕様書

**更新日**: 2026-04-08

---

## プロジェクト概要

デジモン風の育成ゲーム PWA。クリーチャーを育て、進化させ、他プレイヤーと対戦することを目指す。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイ。

---

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| UI | React 18 + TypeScript |
| スタイリング | Tailwind CSS v3 |
| ビルド | Vite 5 |
| PWA | vite-plugin-pwa (Workbox) |
| 永続化 | IndexedDB (idb ライブラリ) |
| フォント | Google Fonts — Press Start 2P |

---

## ディレクトリ構成

```
frontend/src/
├── App.tsx                       # ルートコンポーネント・画面ルーティング
├── vite-env.d.ts                 # Vite環境変数型定義
├── components/
│   ├── ActionButtons.tsx         # えさ/トレーニング/あそぶ/ねる ボタン
│   ├── BattleActionButtons.tsx   # attack/guard/special ボタン（バトル中）
│   ├── BattleHPBar.tsx           # バトル用HPバー（色変化付き）
│   ├── BattleLobbyScreen.tsx     # ルーム作成・参加ロビー画面
│   ├── BattleResult.tsx          # 勝敗結果モーダル
│   ├── BattleScreen.tsx          # バトルメイン画面
│   ├── BattleCreatureDisplay.tsx # バトル用クリーチャー表示（エフェクト付き）
│   ├── CreatureDrawingScreen.tsx # クリーチャーお絵描き画面
│   ├── CreatureSetup.tsx         # クリーチャー名前・タイプ選択
│   ├── CreatureSprite.tsx        # クリーチャーのスプライト表示（カスタムSVG対応）
│   ├── DrawingCanvas.tsx         # お絵描きキャンバス（64x64ピクセルアート）
│   ├── DrawingToolbar.tsx        # お絵描きツールバー（ペン/消しゴム/塗りつぶし）
│   ├── DeathScreen.tsx           # 死亡画面
│   ├── EvolutionScreen.tsx       # 進化演出画面
│   ├── FeedMiniGame.tsx          # ごはんポップアップ演出
│   ├── MainGame.tsx              # メインゲーム画面（⚔️ バトルボタン含む）
│   ├── PlayMiniGame.tsx          # 遊ぶミニゲーム
│   ├── StatusBars.tsx            # 満腹度・しあわせ度バー
│   ├── StatusScreen.tsx          # ステータス詳細画面・クリーチャー一覧・切り替え・新規作成・個別削除
│   ├── TitleScreen.tsx           # タイトル・セーブロード画面
│   └── TrainingMiniGame.tsx      # トレーニングミニゲーム
├── data/
│   └── evolutions.ts             # 進化名・ステージ定義・進化条件・基礎ステータス
├── hooks/
│   ├── useBattleState.ts         # バトル状態管理（useReducer）
│   └── useBattleWebSocket.ts     # WebSocket接続管理・メッセージハンドリング
├── types/
│   ├── battle.ts                 # バトル専用型定義
│   └── creature.ts               # Creature / GameState / GameScreen 型定義
└── utils/
    ├── battleLogic.ts            # ダメージ計算・ターン解決・タイプ相性
    ├── cpuBattle.ts              # CPUバトルのアクション選択ロジック
    ├── evolution.ts              # 進化ロジック
    ├── floodFill.ts              # お絵描き塗りつぶしアルゴリズム
    ├── gameLogic.ts              # えさ/トレーニング/あそぶ/睡眠/時間更新
    ├── storage.ts                # IndexedDB CRUD + JSON セーブエクスポート/インポート
    └── wsToken.ts                # WebSocket接続トークン生成（HMAC-SHA256）
```

---

## 画面遷移

```
title → setup → main ⇄ status（クリーチャー一覧・切り替え・新規作成・個別削除）
main → evolution → drawing → main（進化のたびにお絵描き）
main → death → status（他に生存クリーチャーがいる場合）
main → death → setup（全クリーチャー死亡の場合）
main → battle_lobby → battle → main（勝敗結果反映後）
                     ↘ main（キャンセル）
status → setup（「＋ 新しいクリーチャーを育てる」ボタン、上限5体到達時は無効化）
```

---

## クリーチャータイプ (6種)

| タイプ | 最終進化名 |
|--------|-----------|
| 🔥 Fire | エンペラーモン |
| 💧 Water | オーシャンモン |
| 🌿 Plant | エデンモン |
| ⚡ Thunder | インドラモン |
| 🌑 Dark | ルシフェモン |
| ✨ Light | セラフィモン |

---

## 進化ステージと条件

| ステージ | 名称 | 進化条件 |
|---------|------|----------|
| 0 | タマゴ | — |
| 1 | ベイビー | タマゴをタップ（即時） |
| 2 | チャイルド | age ≥ 1 |
| 3 | アダルト | age ≥ 3, happiness ≥ 50 |
| 4 | パーフェクト | age ≥ 6, level ≥ 8, atk+def+spd ≥ 40 |
| 5 | アルティメット | age ≥ 12, level ≥ 14, 各ステータス ≥ 20 |

> `age` の単位は「時間ティック（30分ティック × 0.5 の累積）」。表示は `Math.floor(age)` 日。

---

## アクション（育成）

タマゴ状態（evolutionStage === 0）ではすべてのアクションボタンが非表示になり、「🥚 タップして生まれる！」ボタンのみ表示される。

### えさ
- ポップアップ演出（`FeedMiniGame`）: 🍖 が1回落下 → クリーチャーがバウンス → 自動で閉じる
- 効果: hunger +30, happiness +5, weight +1（過食時 +3）
- 制限: 睡眠中は不可、**お腹いっぱい（hunger ≥ 100）時は不可**（「お腹いっぱいで食べられない！」メッセージ表示）

### トレーニング
- ミニゲーム（`TrainingMiniGame`）: もぐらたたき（3×3グリッド、制限時間8秒）
- 3秒カウントダウン後にゲーム開始。🐾 が約1秒間隔で出現し0.8秒で消える
- 成功（5匹以上）: atk/def/spd それぞれ +1〜3（ランダム）, hunger -10, EXP +20
- 失敗（4匹以下）: atk/def/spd それぞれ +0〜1（ランダム）, hunger -10, EXP +5
- 制限: 睡眠中・空腹（hunger ≤ 0）時は不可

### あそぶ
- ミニゲーム（`PlayMiniGame`）: 神経衰弱（2×3グリッド、3ペア）
- タイプ別アイコン（Fire: 🔥🌋💥、Water: 💧🌊🐟、Plant: 🌿🌸🍀、Thunder: ⚡🌩️💫、Dark: 🌑🦇👁️、Light: ✨🌟👼）
- 成功（8手以内に全ペア完成）: happiness +20, hunger -5
- 失敗（9手以上）: happiness +5, hunger -5
- **EXP 付与なし**
- 制限: 睡眠中・空腹（hunger ≤ 0）時は不可

### ねる
- 睡眠状態をトグル
- 睡眠中: HP が30分ごとに最大HPの10%回復（`Math.ceil(maxHp * 0.1)`）
- 制限なし

### ⚔️ バトル
- `battle_lobby` 画面に遷移
- アクティブクリーチャーで自動参加
- バトル結果に応じてステータスが変化（後述）

---

## 時間更新サイクル

30分ティックを基本単位として計算（`applyTimeUpdate`）。

| タイミング | 処理 |
|-----------|------|
| 30分ごと | hunger -5, happiness -2 |
| 30分ごと（睡眠中） | hp +ceil(maxHp×0.1) |
| 30分ごと | age +0.5 |
| 30分ごと（hunger ≤ 0 時） | hp -5（餓死ダメージ） |
| hp ≤ 0 | isAlive = false → 死亡画面へ（墓石としてリストに残る） |

### devMode
`devMode = true` のとき時間スケールが加速。
- 30分 → 30秒
- メインタイマー: 5秒ごとに `applyTimeUpdate` 呼び出し

開発・テスト用途のみ。メイン画面のヘッダー「DEV」ボタンで切り替え。

---

## バトルシステム

### バトルロビー画面（BattleLobbyScreen）

- **ルーム作成タブ**: ボタンを押してルームコードを生成・表示（コピー可能）。相手が参加したら「バトル開始」ボタンが活性化
- **ルーム参加タブ**: 6桁ルームコードを入力して参加

### バトル画面（BattleScreen）

```
┌─────────────────────────┐
│ 相手のHPバー（BattleHPBar）│
├─────────────────────────┤
│ [自分]  VS  [相手]       │
│  (左)        (右)        │
├─────────────────────────┤
│ バトルログ（最新5件）      │
├─────────────────────────┤
│ 自分のHPバー（BattleHPBar）│
│ BattleActionButtons      │
└─────────────────────────┘
```

- 自分のクリーチャーは左側、相手は右側に配置
- 互いに向き合うようスプライトを反転表示

### アクション種別

| アクション | 効果 | 備考 |
|-----------|------|------|
| `attack` | 物理攻撃 | 最も基本のアクション |
| `guard` | 防御（DEF効果を2倍に） | そのターンは攻撃しない |
| `special` | 特殊攻撃（タイプ依存） | クールダウン2ターン |

### ダメージ計算式

```
baseDamage = attacker.atk * 1.5 - defender.def * (guarding ? 1.6 : 0.8)
typeMod    = TYPE_ADVANTAGE[attacker.type][defender.type]  // 0.8, 1.0, 1.2
spdMod     = attacker.spd > defender.spd ? 1.1 : 0.9

finalDamage = Math.max(1, Math.floor(baseDamage * typeMod * spdMod))
```

### タイプ相性マトリクス

|         | Fire | Water | Plant | Thunder | Dark | Light |
|---------|------|-------|-------|---------|------|-------|
| Fire    | 1.0  | 0.8   | 1.2   | 1.0     | 1.0  | 1.0   |
| Water   | 1.2  | 1.0   | 0.8   | 1.0     | 1.0  | 1.0   |
| Plant   | 0.8  | 1.2   | 1.0   | 1.0     | 1.0  | 1.0   |
| Thunder | 1.0  | 1.2   | 1.0   | 1.0     | 0.8  | 1.2   |
| Dark    | 1.0  | 1.0   | 1.0   | 1.2     | 1.0  | 0.8   |
| Light   | 1.0  | 1.0   | 1.0   | 0.8     | 1.2  | 1.0   |

### 特殊アクション（special）のタイプ別効果

| タイプ | 効果 |
|-------|------|
| Fire | 連続2回攻撃（各ダメージ×0.7） |
| Water | 自己回復（maxHp × 0.2）+ 攻撃 |
| Plant | 毒付与（3ターン、毎ターン最大HP×3%ダメージ） |
| Thunder | 麻痺（次ターン行動不可 50%確率） |
| Dark | 相手のATKを1ターン −30% |
| Light | 防御バフ（自DEF×1.5、2ターン） |

### 乱数同期（シード方式）

バトルロジックはフロントエンドで完結する。サーバーが乱数シードを発行し、両クライアントが同じ結果を計算することで同期を保つ。

```typescript
// LCG（線形合同法）
function createRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
    return state / 0xFFFFFFFF
  }
}
```

### バトル終了条件

| 条件 | 勝者 |
|------|------|
| いずれかのHP ≤ 0 | 相手プレイヤー |
| 10ターン経過 | HP が多い方（同値: 引き分け） |
| 相手が切断 | 残ったプレイヤー |

### バトル後のステータス反映（APPLY_BATTLE_RESULT アクション）

| 結果 | 変化 |
|------|------|
| 勝利 | wins +1, exp +(50 + 相手level×5), happiness +20 |
| 敗北 | losses +1, exp +10, happiness -10 |
| 引き分け | exp +25 |

HP はバトル終了時の値を維持する。

---

## クリーチャーお絵描き機能

### 概要

進化のたびにプレイヤーが新しい姿を手書きできる機能。64×64 ピクセルアートとして描画し、SVG 文字列で保存する。

### 描画タイミング

- **進化時のみ**: 進化演出画面の後にお絵描き画面（`drawing`）に遷移
- ゲーム新規開始時には描画画面を表示しない（卵から孵化した時点が最初の描画機会）
- スキップ可能（スキップ時はデフォルトスプライト表示）

### キャンバス仕様

| 項目 | 値 |
|------|-----|
| 論理サイズ | 64×64 px |
| 表示サイズ | 256×256 px |
| レンダリング | `imageRendering: pixelated`（ドット絵風） |
| ツール | ペン / 消しゴム / 塗りつぶし |
| カラーパレット | タイプカラー + 自由選択 |
| 出力形式 | SVG 文字列（`viewBox="0 0 64 64"`、width/height 属性なし） |

### 表示サイズ（ステージ別）

カスタムSVGはステージに応じたサイズで表示される（`CreatureSprite.tsx`）。

| ステージ | 表示サイズ (px) |
|---------|----------------|
| 0（タマゴ） | 100 |
| 1（ベイビー） | 160 |
| 2（チャイルド） | 200 |
| 3（アダルト） | 240 |
| 4（パーフェクト） | 270 |
| 5（アルティメット） | 300 |

### 保存方法

- `Creature.customSprites` に `Partial<Record<EvolutionStage, string>>` として保存
- 進化ごとに新しいステージの SVG が追加される（既存ステージのデータは保持）
- IndexedDB に永続化。セーブエクスポート時は XSS 防止のため `customSprites` を除外

---

## 型定義

### GameScreen

```typescript
type GameScreen =
  | 'title'
  | 'setup'
  | 'main'
  | 'status'
  | 'evolution'
  | 'death'
  | 'drawing'       // クリーチャーお絵描き（進化後に表示）
  | 'battle_lobby'  // バトルロビー（ルーム作成・参加）
  | 'battle'        // バトルメイン
```

### GameState

```typescript
interface GameState {
  creatures: Creature[]            // 全クリーチャーのリスト（墓石含む）
  activeCreatureId: string | null  // 現在操作中のクリーチャーID
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  animationState: 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead'
  message: string | null
}
```

### SaveData（ストレージ用）

```typescript
interface SaveData {
  creatures: Creature[]
  activeCreatureId: string | null
}
```

### Creature（抜粋）

```typescript
interface Creature {
  // ... 既存フィールド ...
  isAlive: boolean   // false = 墓石状態
  wins?: number      // バトル勝利数
  losses?: number    // バトル敗北数
  customSprites?: Partial<Record<EvolutionStage, string>>  // ステージ別カスタムSVG
}
```

### BattleState

```typescript
interface BattleState {
  phase: 'waiting' | 'ready' | 'selecting' | 'resolving' | 'finished'
  roomCode: string | null
  role: 'host' | 'guest' | null
  myCreature: CreatureSnapshot | null
  opponentCreature: CreatureSnapshot | null
  currentTurn: number
  myAction: BattleAction | null
  opponentAction: BattleAction | null
  specialCooldown: number
  myPoisonTurns: number
  opponentPoisonTurns: number
  myParalyzed: boolean
  myDefBuff: number
  battleLog: string[]
  winner: 'me' | 'opponent' | 'draw' | null
  error: string | null
}
```

---

## フック

### useBattleWebSocket

WebSocket 接続の管理、自動ping（30秒ごと）、自動再接続（5秒後、最大3回）を担う。

```typescript
interface UseBattleWebSocketReturn {
  isConnected: boolean
  connect: (creature: Creature) => Promise<void>
  disconnect: () => void
  sendCreateRoom: (creature: Creature) => void
  sendJoinRoom: (roomCode: string, creature: Creature) => void
  sendReady: (roomCode: string) => void
  sendAction: (roomCode: string, action: BattleAction) => void
  sendPing: () => void
  sendLeaveRoom: (roomCode: string) => void
  lastEvent: ServerEvent | null
}
```

接続時に `generateWsToken()` でトークンを生成し `?token=xxx&ts=yyy` をURLに付与する。

### useBattleState

`useReducer` でバトル状態を管理。`processEvent(event: ServerEvent)` で受信イベントを処理する。

### 状態管理（App.tsx）

ゲーム状態は `App.tsx` で `useState` 群により管理する（`useGameState.ts` は削除済み）。
`creatures: Creature[]` + `activeCreatureId: string | null` で複数クリーチャーを管理し、`activeCreature` を導出で取得する。
クリーチャーの保持数は最大5体（死亡含む）。上限到達時は新規作成ボタンが無効化される。
ステータス画面からアクティブでないクリーチャーを個別削除可能（確認ダイアログ付き）。
バトル結果はアクティブクリーチャーに対して反映される。

---

## ユーティリティ

### wsToken.ts

Web Crypto API（`crypto.subtle`）を使って HMAC-SHA256 トークンを生成する。
環境変数 `VITE_WS_SECRET_KEY` からシークレットを取得。

### battleLogic.ts

- `calcDamage(attacker, defender, guarding)` — ダメージ計算
- `calcSpecial(attacker, defender, rng)` — 特殊アクション効果計算
- `resolveTurn(...)` — 1ターンの解決（継続効果含む）
- `createRng(seed)` — シード付き乱数生成器（LCG）
- `TYPE_ADVANTAGE` — タイプ相性マトリクス定数

---

## 環境変数

`frontend/.env`（`.env.example` を参照）:

```
VITE_WS_URL=wss://xxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
VITE_WS_SECRET_KEY=your-secret-key-here
```

`VITE_WS_URL` は `terraform output websocket_url` で確認できる。
`VITE_WS_SECRET_KEY` は Terraform の `var.secret_key` と同じ値を設定する。

---

## 永続化

- IndexedDB (`digi-raise` DB, `gameState` ストア) に `SaveData` を固定キー `"saveData"` で一括保存
- 全クリーチャー情報（墓石含む）と `activeCreatureId` をまとめて保存・読み込み
- アクティブクリーチャーのみ `lastUpdated` タイムスタンプを元に再起動時に時間を一括適用
- 非アクティブクリーチャーは時間停止。切り替え時に `lastUpdated` を現在時刻にリセット
- 旧形式（`"currentCreature"` キー）からの自動移行処理あり（`migrateLegacyData`）
- ステータス画面からセーブデータ全体のエクスポート/インポートが可能（JSON ファイル）
  - File System Access API 対応ブラウザはファイルピッカー、非対応はフォールバック
  - インポート時はバリデーション実施（型検証・件数50件上限・ファイルサイズ1MB上限）
  - 旧形式（v1: クリーチャー単体）のインポートファイルも後方互換で読み込み可能

---

## 開発コマンド

```bash
# frontend/ ディレクトリ内で実行
cd frontend
npm install
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)
```

---

## デプロイ

GitHub Pages にデプロイ。`vite.config.ts` で `base: '/digi-raise/'` を設定済み。
ビルド後 `dist/` を `gh-pages` ブランチへプッシュ。

公開 URL: `https://<username>.github.io/digi-raise/`

---

## 実装上の注意

- `GameState` 型は `frontend/src/types/creature.ts` に定義。状態管理の中枢は `App.tsx`（useState群）。`useGameState.ts` は削除済み。
- クリーチャーは `creatures: Creature[]` + `activeCreatureId: string | null` で管理。`activeCreature` は導出で取得。
- 非アクティブクリーチャーは時間停止。切り替え時に `lastUpdated` を現在時刻にリセットする。
- 死亡クリーチャーは `isAlive: false` の状態でリストに墓石として残る。個別削除も可能。
- クリーチャーの保持上限は5体（`MAX_CREATURES = 5`、死亡含む）。上限時は新規作成ボタンを無効化。
- アクティブクリーチャーは削除不可。削除前に `window.confirm` で確認を表示。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま行われ、表示のみ `Math.floor`。
- トレーニング成功/失敗時に EXP の数値は画面に表示しない。
- ごはんアクションは EXP を付与しない。
- バトルロジックはサーバーに委譲せず、フロントエンドで双方が独立して計算する。乱数シードはサーバーが発行する。バトルはアクティブクリーチャーで自動参加。

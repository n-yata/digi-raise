# CLAUDE.md — digi-raise

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイする。

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| UI | React 18 + TypeScript |
| スタイリング | Tailwind CSS v3 |
| ビルド | Vite 5 |
| PWA | vite-plugin-pwa (Workbox) |
| 永続化 | IndexedDB (idb ライブラリ) |
| フォント | Google Fonts — Press Start 2P |

## ディレクトリ構成

```
src/
├── App.tsx                  # ルートコンポーネント・画面ルーティング
├── components/
│   ├── ActionButtons.tsx    # えさ/トレーニング/あそぶ/ねる ボタン
│   ├── CreatureSetup.tsx    # クリーチャー名前・タイプ選択
│   ├── CreatureSprite.tsx   # クリーチャーの SVG スプライト表示
│   ├── DeathScreen.tsx      # 死亡画面
│   ├── EvolutionScreen.tsx  # 進化演出画面
│   ├── MainGame.tsx         # メインゲーム画面
│   ├── StatusBars.tsx       # 満腹度・しあわせ度バー
│   ├── StatusScreen.tsx     # ステータス詳細画面
│   └── TitleScreen.tsx      # タイトル・セーブロード画面
├── data/
│   └── evolutions.ts        # 進化名・ステージ定義・進化条件・基礎ステータス
├── hooks/
│   ├── useGameState.ts      # useReducer によるゲーム状態管理
│   └── useTimeUpdate.ts     # 時間経過による自動ステータス更新
├── types/
│   └── creature.ts          # Creature / GameState / GameScreen 型定義
└── utils/
    ├── evolution.ts         # 進化ロジック
    ├── gameLogic.ts         # えさ/トレーニング/あそぶ/睡眠/時間更新
    └── storage.ts           # IndexedDB CRUD + JSON セーブエクスポート/インポート
```

## ゲーム仕様

### クリーチャータイプ (6種)
`Fire` / `Water` / `Plant` / `Thunder` / `Dark` / `Light`

### 進化ステージ (6段階)
| ステージ | 名称 | 進化条件 |
|---------|------|----------|
| 0 | タマゴ | — |
| 1 | ベイビー | age ≥ 1 |
| 2 | チャイルド | age ≥ 3, happiness ≥ 50 |
| 3 | アダルト | age ≥ 7, level ≥ 10, atk+def+spd ≥ 60 |
| 4 | パーフェクト | age ≥ 14, level ≥ 20, 各ステータス ≥ 30 |
| 5 | アルティメット | — (最終形態) |

### 時間更新サイクル
- 30分ごと: hunger -5, happiness -2
- 1時間ごと: age +1, 睡眠中は hp 回復 (+10/h)
- hunger ≤ 0: hp -5/30分 (スタベーション)
- hp ≤ 0: 死亡 → death 画面

### アクション制限
- **睡眠中**: えさ・トレーニング・遊ぶ が無効
- **空腹0 (hunger ≤ 0)**: トレーニング・遊ぶ が無効

### トレーニングミニゲーム (`TrainingMiniGame.tsx`)
- バーの緑ゾーン (35〜65%) でタップすると成功
- 成功/失敗時に EXP 表記は表示しない

### devMode
`devMode = true` のとき時間スケールが加速する（30分 → 30秒, 1時間 → 1分）。
開発・テスト用途のみ。

### 画面遷移
`title` → `setup` → `main` ⇄ `status`
`main` → `evolution` → `main`
`main` → `death` → `title`

### 永続化
- IndexedDB (`digi-raise` DB, `gameState` ストア) に自動保存
- セーブデータのエクスポート/インポートは JSON ファイル (File System Access API、非対応ブラウザはフォールバックあり)

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)
```

## デプロイ

GitHub Pages にデプロイ。`vite.config.ts` で `base: '/digi-raise/'` を設定済み。

## 注意事項

- `src/types/creature.ts` と `src/hooks/useGameState.ts` の両方に `GameState` インターフェースが存在する。hooks 側が実際の状態管理に使われている（進化アニメーション用フィールドを含む）。
- ステータス加算のランダム性あり（トレーニング時: atk/def/spd それぞれ +1〜3）。
- `age` の単位は「時間」ではなく「時間ティック数」（hourTicks の累積）。

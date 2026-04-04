# デジレイズ (DigiRaise) ゲーム仕様書

## プロジェクト概要

デジモン風の育成ゲーム PWA。クリーチャーを育て、進化させることを目指す。
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
├── App.tsx                    # ルートコンポーネント・画面ルーティング
├── components/
│   ├── ActionButtons.tsx      # えさ/トレーニング/あそぶ/ねる ボタン
│   ├── CreatureSetup.tsx      # クリーチャー名前・タイプ選択
│   ├── CreatureSprite.tsx     # クリーチャーのスプライト表示
│   ├── DeathScreen.tsx        # 死亡画面
│   ├── EvolutionScreen.tsx    # 進化演出画面
│   ├── FeedMiniGame.tsx       # ごはんポップアップ演出
│   ├── MainGame.tsx           # メインゲーム画面
│   ├── PlayMiniGame.tsx       # 遊ぶミニゲーム
│   ├── StatusBars.tsx         # 満腹度・しあわせ度バー
│   ├── StatusScreen.tsx       # ステータス詳細画面
│   ├── TitleScreen.tsx        # タイトル・セーブロード画面
│   └── TrainingMiniGame.tsx   # トレーニングミニゲーム
├── data/
│   └── evolutions.ts          # 進化名・ステージ定義・進化条件・基礎ステータス
├── types/
│   └── creature.ts            # Creature / GameState / GameScreen 型定義
└── utils/
    ├── evolution.ts           # 進化ロジック
    ├── gameLogic.ts           # えさ/トレーニング/あそぶ/睡眠/時間更新
    └── storage.ts             # IndexedDB CRUD + JSON セーブエクスポート/インポート
```

---

## 画面遷移

```
title → setup → main ⇄ status
main → evolution → main
main → death → title
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

## アクション

タマゴ状態（evolutionStage === 0）ではすべてのアクションボタンが非表示になり、「🥚 タップして生まれる！」ボタンのみ表示される。

### えさ
- ポップアップ演出（`FeedMiniGame`）: 🍖 が1回落下 → クリーチャーがバウンス → 自動で閉じる
- 効果: hunger +30, happiness +5, weight +1（過食時 +3）
- 制限: 睡眠中は不可

### トレーニング
- ミニゲーム（`TrainingMiniGame`）: 動くバーの緑ゾーン（35〜65%）でタップ
- 成功: atk/def/spd それぞれ +1〜3（ランダム）, hunger -10, EXP +20
- 失敗: atk/def/spd それぞれ +0〜1（ランダム）, hunger -10, EXP +5
- 制限: 睡眠中・空腹（hunger ≤ 0）時は不可

### あそぶ
- ミニゲーム（`PlayMiniGame`）: クリーチャーを3回タップ
- 効果: happiness +20, hunger -5, EXP +5
- 制限: 睡眠中・空腹（hunger ≤ 0）時は不可

### ねる
- 睡眠状態をトグル
- 睡眠中: HP が30分ごとに +5 回復（= 10/時間）
- 制限なし

---

## 時間更新サイクル

30分ティックを基本単位として計算（`applyTimeUpdate`）。

| タイミング | 処理 |
|-----------|------|
| 30分ごと | hunger -5, happiness -2 |
| 30分ごと（睡眠中） | hp +5 |
| 30分ごと | age +0.5 |
| 30分ごと（hunger ≤ 0 時） | hp -5（餓死ダメージ） |
| hp ≤ 0 | isAlive = false → 死亡画面へ |

### devMode
`devMode = true` のとき時間スケールが加速。
- 30分 → 30秒
- メインタイマー: 5秒ごとに `applyTimeUpdate` 呼び出し

開発・テスト用途のみ。メイン画面のヘッダー「DEV」ボタンで切り替え。

---

## 永続化

- IndexedDB (`digi-raise` DB, `gameState` ストア) に自動保存
- アプリを閉じている間も `lastUpdated` タイムスタンプを元に再起動時に時間を一括適用
- ステータス画面からセーブデータのエクスポート/インポートが可能（JSON ファイル）
  - File System Access API 対応ブラウザはファイルピッカー、非対応はフォールバック

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

## デプロイ

GitHub Pages にデプロイ。`vite.config.ts` で `base: '/digi-raise/'` を設定済み。
ビルド後 `dist/` を `gh-pages` ブランチへプッシュ。

公開 URL: `https://<username>.github.io/digi-raise/`

---

## 実装上の注意

- `frontend/src/types/creature.ts` と `frontend/src/hooks/useGameState.ts` の両方に `GameState` インターフェースが存在する。hooks 側が実際の状態管理に使われている（進化アニメーション用フィールドを含む）。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま行われ、表示のみ `Math.floor`。
- トレーニング成功/失敗時に EXP の数値は画面に表示しない。
- ごはんアクションは EXP を付与しない。

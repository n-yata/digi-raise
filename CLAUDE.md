# CLAUDE.md — digi-raise

仕様書は以下を参照:
- フロントエンド仕様: [`docs/specifications/spec-frontend.md`](docs/specifications/spec-frontend.md)

## ディレクトリ構成

```
digi-raise/
├── src/               # ソースコード（React + TypeScript）
│   ├── components/    # React コンポーネント
│   ├── hooks/         # カスタムフック
│   ├── types/         # 型定義
│   ├── utils/         # ユーティリティ
│   ├── data/          # 静的データ
│   ├── main.tsx       # エントリーポイント
│   └── index.css      # グローバルスタイル
├── public/            # 静的アセット
├── docs/              # 仕様書・設計ドキュメント
├── .github/           # GitHub Actions ワークフロー
├── index.html         # エントリー HTML
├── package.json       # 依存関係・スクリプト
├── vite.config.ts     # Vite 設定
├── tsconfig.json      # TypeScript 設定
├── tailwind.config.js # Tailwind CSS 設定
└── CLAUDE.md
```

## プロジェクト概要

デジモン風の育成ゲーム **デジレイズ (DigiRaise)** の PWA アプリ。
React + TypeScript + Vite で構築し、GitHub Pages にデプロイする。
バトルはフロントエンド完結（CPU戦・QRバトル）。バックエンドなし。

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript チェック + Vite ビルド
npm run preview  # ビルド成果物のプレビュー
npm run lint     # ESLint (max-warnings 0)
npm run test:run # テスト実行
```

## 仕様書の更新ルール

実装が完了したら、`docs/specifications/` の仕様書も併せて最新化すること。

## ゲームデザイン決定時の原則

以下のようなゲームデザインに関わる判断が発生した場合、**チームに実装を割り振る前に必ずシャビに確認すること**。

- 新しい進化系統・ステージの追加（進化条件の数値含む）
- EXP、ステータス成長値、アクション効果量の変更
- バトルのダメージ計算式・タイプ相性係数の変更
- 特殊アクション（special）の効果内容の追加・変更
- 新しいアクション・ゲームメカニクスの追加
- バランスに影響する時間更新サイクルの変更

ゲームデザイン上の意思決定は `docs/game-design.md` に記録すること。
未決定事項は同ファイルの「未決定事項」セクションに追記し、シャビの判断を待つこと。

## 実装上の注意

- `GameState` 型は `src/types/creature.ts` に定義。`creatures: Creature[]` + `activeCreatureId: string | null` で複数クリーチャーを管理する。
- 状態管理の中枢は `App.tsx`（useState群）。`useGameState.ts` は削除済み。
- クリーチャーの保存は `SaveData { creatures, activeCreatureId }` を固定キー `"saveData"` で IndexedDB に一括保存（`storage.ts`）。
- 非アクティブのクリーチャーは時間停止。切り替え時に `lastUpdated` を現在時刻にリセットする。
- 死亡クリーチャーは `isAlive: false` の状態でリストに墓石として残る。個別削除も可能。
- クリーチャーの保持上限は5体（`MAX_CREATURES = 5`、死亡含む）。上限時は新規作成ボタンを無効化。アクティブクリーチャーは削除不可。
- `age` は float（30分ティックごとに +0.5）。進化条件の比較は float のまま、表示のみ `Math.floor`。
- ごはんアクションは EXP を付与しない。
- devMode は `App.tsx` のヘッダー「DEV」ボタンで切り替え。時間スケール: 30分 → 30秒。
- バトルロジック（ダメージ計算・ターン解決）はフロントエンドで完結。バトルはアクティブクリーチャーで自動参加。
- QRバトル: 相手クリーチャーデータをQRコード経由で取得し、CPU AIで相手アクションを自動選択してローカルバトル。
- タイプ相性マトリクスは `src/utils/battleLogic.ts` の `TYPE_ADVANTAGE` が正。有利: ×1.2、不利: ×0.8。

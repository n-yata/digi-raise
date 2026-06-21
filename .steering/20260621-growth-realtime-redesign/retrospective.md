# 実装後の振り返り

## 作業概要
成長システムをリアルタイム化。年齢を「現実1日 = +1歳」へ、おなかを「時間経過のみ・約8時間で空腹（1日3回の食事ペース）」へ変更。
裏パラメータ「疲労度（fatigue）」を新設し、トレ/遊ぶで蓄積・時間経過で常時回復・MAXで実行不可・60以上で疲労モーション。
進化条件 `minAge` を日数（0.5/1/3/7）へ再スケール。既存の30分ティック構造は維持し、レート定数の差し替えで実現した。

## 実装完了日
2026-06-21

## 計画と実績の差分

**計画と異なった点**:
- 疲労モーションのアニメ定義は当初 `index.css` を想定していたが、実態ではアニメーションは `tailwind.config.js` の `theme.extend.animation/keyframes` に集約されていたため、そちらに `tired-droop` / `tiredDroop` を追加した（design.md/tasklist の P5-4 を実態に合わせ修正）。
- `getExpression`（DefaultCreatureBody.tsx）にも `tired` ケースを追加し、ドット絵・フォールバック両方で眠そうな表情になるようにした（当初はラッパーアニメのみ想定）。

**新たに必要になったタスク**:
- worktree に `node_modules` が無く vitest/build が動かなかったため `npm ci` を実施（worktree 運用では毎回必要）。

**技術的理由でスキップしたタスク**:
- P7-2 `npm run lint`: eslint がプロジェクトに未導入（`package.json` の devDependencies に無く、設定ファイルも存在しない）。本変更とは無関係の既存状態。型チェックは `npm run build`（tsc）で通過済み、テスト290件パスで品質担保。

## 学んだこと

**技術的な学び**:
- `fatigue` を必須型フィールドにしつつ、レガシーセーブ（フィールド欠落）互換のため `validateCreature` では `optionalNumFields` に入れ、読み出しは全経路で `fatigue ?? 0` に統一した（`lightsOn ?? true` と同じ後方互換パターン）。`undefined + 数値 = NaN` を防ぐのが要点。
- `tsconfig.json` が `src/**/*.test.ts(x)` を `exclude` しているため、テストファイルの型崩れ（既存の `type:'Fire'` 等）は `tsc` ビルドを壊さない。テストは vitest（esbuild トランスパイル）で型チェックなしに実行される。
- 年齢/おなか/疲労のレートはすべて名前付き定数（`AGE_PER_TICK` 等）に集約し、`ActionButtons` も `FATIGUE_MAX` を import して二重定義を回避。マジックナンバーを残さない。

**プロセス上の改善点**:
- `/plan-feature` で合意済みの requirements.md を尊重し、design.md/tasklist.md のみ生成 → 実装まで無停止で進められた。設計判断（進化日数・疲労数値）は計画段階で AskUserQuestion により確定済みだったため、実装中の手戻りゼロ。
- ギュレル（implementation-validator）とクルトワ（security-engineer）を並列起動し、品質・セキュリティを同時に検証できた。

## 次回への改善提案
- worktree 運用では実装着手前に `npm ci` を済ませておくと検証フェーズで待たされない。
- `npm run lint` が機能していない（eslint 未導入）。CI/品質ゲートとして lint を効かせたいなら、別タスクで eslint + flat config の導入を検討する価値がある。
- 既存セーブの `age` は旧「時間」値をそのまま「日」として扱う方針（移行なし）。違和感が出たら別スプリントでマイグレーションを検討する。

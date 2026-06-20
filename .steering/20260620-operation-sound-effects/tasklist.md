# タスクリスト: 操作時の効果音追加

## 概要

Web Audio API 合成によるサウンドエンジンを新設し、全主要操作に効果音を割り当てる。ミュート切替（localStorage 永続化）込み。
詳細は [requirements.md](./requirements.md) / [design.md](./design.md) を参照。

## フェーズ別タスク

### P1: サウンドエンジン

- [x] T1-1: `src/utils/sound.ts` 実装（AudioContext シングルトン・合成再生・音種定義・ミュート管理・autoplay 解放）
- [x] T1-2: `src/hooks/useSound.ts` 実装（ミュート状態の購読・トグル）

### P2: 操作への組み込み

- [x] T2-0: `src/main.tsx` で initSound() 呼び出し
- [x] T2-1: `App.tsx` の各ハンドラに効果音を接続（feed/play/train/sleep/evolve/hatch/battle）
- [x] T2-2: `StatusScreen.tsx` にミュート ON/OFF トグル UI を追加

### P3: テスト・品質

- [x] T3-1: `sound.ts` のミュート管理・no-op 安全性の単体テスト（9件）
- [x] T3-2: `npm run build`（tsc+vite）/ `npm run test:run`（247件）パス
  - 補足: `npm run lint` は eslint が devDependencies 未導入のため元々実行不可（既存課題）。型チェック（tsc）で代替。

### P4: レビュー・検証

- [x] T4-1: クルトワ（security-engineer）レビュー → Critical/High/Medium なし
- [x] T4-2: verify（実機）— 遊ぶ→osc3生成/running、ミュートで生成0、localStorage 永続化を確認
- [ ] T4-3: PR 作成・マージ

## リスク・懸念事項

- ブラウザ autoplay ポリシー: 初回ジェスチャ前は音が出ない → window へのジェスチャリスナで resume。
- jsdom に AudioContext が無い → テストではモック化して再生呼び出しの安全性のみ検証。

## 永続ドキュメントへの影響

- [ ] glossary.md / functional-design.md への軽微な追記余地あり（P4 後に必要なら反映）。基本設計への影響なし。

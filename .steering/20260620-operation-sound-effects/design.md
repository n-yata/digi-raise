# 設計: 操作時の効果音追加

## 方針

Web Audio API で短い効果音をその場で合成する軽量サウンドエンジンを新設し、既存の操作ハンドラ（主に `App.tsx`）と共通ボタンから呼び出す。音声バイナリアセットは持たない。

## 追加・変更ファイル

| ファイル | 種別 | 内容 |
|---------|------|------|
| `src/utils/sound.ts` | 新規 | Web Audio 合成サウンドエンジン。効果音定義・再生・ミュート管理。 |
| `src/hooks/useSound.ts` | 新規 | React から扱うための薄いフック（ミュート状態の購読・トグル）。 |
| `src/main.tsx` | 変更 | 起動時に initSound() で autoplay 解放を仕込む。 |
| `src/App.tsx` | 変更 | 各操作ハンドラで対応する効果音を再生。 |
| `src/components/StatusScreen.tsx` | 変更 | ミュート ON/OFF トグル UI を追加（設定の置き場として自然）。 |

## サウンドエンジン設計（`src/utils/sound.ts`）

### 音の種類（SoundType）

| キー | 用途 | 音のイメージ |
|------|------|------------|
| `tap` | 汎用ボタンタップ | 短いクリック（高音ブリップ） |
| `feed` | ごはん | 上昇する優しい2音 |
| `play` | 遊ぶ | 弾むような明るい音 |
| `trainSuccess` | トレ成功 | 上昇アルペジオ |
| `trainFail` | トレ失敗 | 下降する短音 |
| `sleep` | おやすみ | ゆっくり下降 |
| `wake` | おはよう | ゆっくり上昇 |
| `evolve` | 進化 | 華やかな上昇アルペジオ（長め） |
| `hatch` | 卵ふ化 | きらめく上昇音 |
| `battleStart` | バトル開始 | 緊張感のある2音 |
| `win` | 勝利 | ファンファーレ風 |
| `lose` | 敗北 | 下降する悲しい音 |

### 実装要点

- 単一の `AudioContext` を遅延生成（シングルトン）。
- 自動再生制限対応: 初回のユーザージェスチャで `ctx.resume()` を呼ぶ。`window` への `pointerdown`/`keydown` リスナで解放。
- 各音は `OscillatorNode` + `GainNode` のエンベロープ（短いアタック／指数ディケイ）で合成。音種ごとに周波数列・波形・長さを定義。
- ミュート時は再生をスキップ。
- 例外安全: AudioContext 非対応環境では no-op（クラッシュさせない）。

### ミュート状態の永続化

- `localStorage` キー `digi-raise:muted`（'1'/'0'）。
- セーブデータ（IndexedDB）とは独立した端末ローカルの UI 設定として扱う。
- subscribe/notify を `sound.ts` に持たせ `useSound` から購読。

## 操作と効果音の対応（`App.tsx`）

| ハンドラ | 効果音 |
|---------|--------|
| `handleFeed`（成功時） | `feed` |
| `handlePlay` | `play` |
| `handleTrainResult(success)` | `trainSuccess` / `trainFail` |
| `handleSleep` | `sleep` / `wake`（トグル結果で分岐） |
| `handleEvolve` | `evolve` |
| 卵ふ化完了（ふ化 useEffect 内） | `hatch` |
| `handleCpuBattleStart` / `handleQrBattleStart` | `battleStart` |
| `handleBattleEnd` | `win` / `lose`（引き分けは `tap`） |

> 押下できなかったケース（満腹で食べられない等）は固有音を鳴らさない。

## セキュリティ考慮

- 外部 URL・バイナリアセットを一切持たない（ハードコード URL 問題が発生しない）。
- localStorage に保存するのは真偽値フラグのみ（機密情報なし）。
- ユーザー入力を音生成に流さない（インジェクション面なし）。

## テスト方針

- `sound.ts` のミュート状態管理（get/set/toggle/subscribe、localStorage 連携）を単体テスト。
- AudioContext はテスト環境（jsdom）に無いため、`playSound`/`initSound` が例外を投げず no-op で安全に通ることを検証。

## 永続ドキュメントへの影響

- 基本設計（アーキ・データフロー）への影響なし。glossary.md / functional-design.md への軽微な追記余地は P4 後に判断。

# 設計書: メイン画面での即時アクション化（ミニゲーム廃止）

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ（軽量UI配線変更のため自身で設計） |
| 関連要求 | `.steering/20260620-inline-main-screen-actions/requirements.md` |

---

## 1. 概要

### 設計方針サマリ

- **目的**: ごはん/トレ/遊びをメイン画面のまま1タップで即実行（モーダル廃止）
- **方式**: `App.tsx` のハンドラからミニゲーム表示 state を撤去し、`gameLogic` の関数を直接呼ぶ。トレ/遊びは `success=true` 固定。
- **最小スコープ厳守**: 効果量ロジック・他フローは不変。UI 配線とミニゲーム削除のみ。
- **既存資産は壊さない**: `gameLogic.ts` / `ActionButtons.tsx` / バトル系は変更しない。
- **ハードコーディング禁止**: 新規定数・URL の追加なし。

### スコープ確定（成否の扱い）

| 論点 | 採用 |
|------|------|
| トレーニングの成否 | 常に成功（1タップ完了）。`trainCreature(c, true)` |
| 遊びの成否 | 常に成功のみ。`playWithCreature(c, true)` |
| ミニゲームコンポーネント | 完全削除（呼び出し・ファイルとも） |

---

## 2. 改造ポイント（`src/App.tsx`）

### 2.1 削除する要素

| 対象 | 行（変更前の目安） | 内容 |
|------|------|------|
| import | L15-17 | `TrainingMiniGame` / `PlayMiniGame` / `FeedMiniGame` の import |
| state | L39-41 | `showTrainingGame` / `showPlayGame` / `showFeedGame` |
| ハンドラ | L209-215, L222-230, L237-243 | `handleFeedDone` / `handleTrainResult` / `handlePlayResult` |
| 描画 | L543-551 | 3つのミニゲームモーダルの条件付きレンダリング |

### 2.2 書き換えるハンドラ

```ts
// ごはん: モーダルを開かず即適用（満腹ガードは維持）
const handleFeed = useCallback(() => {
  const c = creatureRef.current
  if (!c) return
  if (c.hunger >= 100) { showMessage('お腹いっぱいで食べられない！'); return }
  const updated = feedCreature(c)
  persistActiveCreature(updated)
  showMessage('もぐもぐ！ご飯を食べた！')
}, [persistActiveCreature, showMessage])

// トレーニング: 常に成功扱いで即適用（攻撃アニメ＋成功メッセージ）
const handleTrain = useCallback(() => {
  const c = creatureRef.current
  if (!c || c.isSleeping) return
  const updated = trainCreature(c, true)
  persistActiveCreature(updated)
  setAttackAnimation(true)
  showMessage('トレーニング成功！大きく強くなった！')
  setTimeout(() => setAttackAnimation(false), 1200)
}, [persistActiveCreature, showMessage])

// 遊び: 常に成功扱いで即適用
const handlePlay = useCallback(() => {
  const c = creatureRef.current
  if (!c || c.isSleeping) return
  const updated = playWithCreature(c, true)
  persistActiveCreature(updated)
  showMessage('一緒に遊んだ！楽しかった！')
}, [persistActiveCreature, showMessage])
```

> 注: `trainCreature` / `playWithCreature` 内部にも `isSleeping`/`isAlive` ガードがあるため二重に安全。
> `ActionButtons` 側の disabled 条件（睡眠中・hunger<=0）も従来通り効くので押下自体が抑止される。

### 2.3 触らない要素

| 対象 | 扱い |
|------|------|
| `gameLogic.ts`（feed/train/play 効果量） | **変更なし** |
| `ActionButtons.tsx`（ボタン構成・disabled 条件） | **変更なし** |
| `MainGame.tsx`（onFeed/onTrain/onPlay の受け渡し） | **変更なし**（props シグネチャ不変） |
| バトル / ステータス / 寝る / 進化 / 卵ふ化 | **変更なし** |

---

## 3. 削除ファイル

| ファイル | 種別 |
|---------|------|
| `src/components/FeedMiniGame.tsx` | 削除 |
| `src/components/TrainingMiniGame.tsx` | 削除 |
| `src/components/PlayMiniGame.tsx` | 削除 |

参照は `App.tsx` のみ（grep 確認済み）。削除後 import が消えるため未使用参照は残らない。

---

## 4. 影響範囲

| 機能 | 影響 | 緩和策 |
|------|------|--------|
| ごはん/トレ/遊び | 操作フロー変更（即時化） | 効果量は不変のためバランス影響なし |
| ミニゲームでの体験 | 廃止 | シャビ承認済みの仕様変更 |
| 他フロー（バトル等） | なし | props・state を触らない |

---

## 5. 検証（受け入れ条件への対応）

| 受け入れ条件 | 検証方法 |
|-------------|---------|
| 即時発動・モーダルなし | `npm run dev` で feed/train/play を実操作（verify スキル） |
| 効果量適用 | StatusBars / ステータス画面で hunger/happiness/atk 等の増減を確認 |
| 参照残りなし | grep で MiniGame 参照ゼロ |
| ビルド/lint | `npm run build` / `npm run lint` |

---

作成: モドリッチ / 2026-06-20

# 設計書: 卵のドット絵化と数秒後の自動ふ化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-20 |
| 担当 | モドリッチ |
| 関連要求 | `.steering/20260620-egg-analog-hatch/requirements.md` |

---

## 1. 概要

- **卵描画**: 既存のドット絵基盤（`PixelSprite` + `paletteFor(type)`）を流用し、
  卵専用の 32×32 グリッドを 1 枚だけ用意する。タイプ別に色だけ差し替わる（形状は共通）。
- **ふ化ディレイ**: `App.tsx` の stage 0 自動ふ化を `setTimeout`（3000ms）でラップする。
  画面遷移・クリーチャー変更時はタイマーを破棄し、発火時に状態を再検証して二重ふ化を防ぐ。

## 2. 変更箇所

### 2.1 新規: `src/components/creatures/pixel/egg.ts`

- `EGG_GRID`（32 行 × 32 文字）を定義。使用キーは共通シェード `k/o/d/r/l` のみ
  （アクセント色は使わずタイプ非依存に保つ）。
- `getEggPixel(type: CreatureType): PixelSpriteData` を export。
  `{ grid: EGG_GRID, palette: paletteFor(type) }` を返す。

### 2.2 `src/components/creatures/pixel/index.ts`

- `export { getEggPixel } from './egg'` を追加。

### 2.3 `src/components/CreatureSprite.tsx`

- `EggBody` import を削除し、`getEggPixel` を import。
- stage 0 を `<PixelSprite data={getEggPixel(type)} size={size} />` で描画。

### 2.4 `src/App.tsx` — stage 0 自動ふ化に 3 秒ディレイ

```ts
const EGG_HATCH_DELAY_MS = 3000 // 卵をメイン画面に見せてから自動ふ化するまで

useEffect(() => {
  if (!activeCreature || screen !== 'main') return
  if (!canEvolve(activeCreature)) { setPendingEvolution(false); return }

  if (activeCreature.evolutionStage === 0) {
    // 卵: 数秒見せてから自動ふ化（タップ不要）
    const timer = setTimeout(() => {
      const c = creatureRef.current
      if (!c || c.evolutionStage !== 0 || !canEvolve(c)) return
      const evolved = evolveCreature(c)
      setEvolvedFrom(0)
      persistActiveCreature(evolved)
      setPendingEvolution(false)
      setScreen('evolution')
    }, EGG_HATCH_DELAY_MS)
    return () => clearTimeout(timer)
  }
  setPendingEvolution(true)
}, [activeCreature, screen, persistActiveCreature])
```

- タイマーは依存変更（画面遷移・クリーチャー切替）で `clearTimeout`。
- 発火時に `creatureRef.current` で最新状態を再検証し、stage 0 かつ `canEvolve` の時だけふ化。

### 2.5 削除: `src/components/creatures/EggBody.tsx`

- 参照は `CreatureSprite.tsx` のみ。差し替え後に削除する。

### 2.6 永続ドキュメント

- `docs/architecture.md` / `docs/repository-structure.md` の EggBody 記述を
  「卵もドット絵スプライト（egg.ts）」に更新。

## 3. 影響範囲

| 機能 | 影響 |
|------|------|
| ベイビー以降の進化（タップ） | なし（`canEvolve` の else 分岐で従来通り） |
| 死亡・スリープ時のガード | なし（`canEvolve` の既存ガードが有効） |
| 進化演出画面 | なし（同じ `setScreen('evolution')` を通る） |
| tick ループ | なし（stage 0 は元から対象外: `evolutionStage > 0` ガード） |

---

作成: モドリッチ / 2026-06-20

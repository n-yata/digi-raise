# 設計書: 卵の自動ふ化

| 項目 | 内容 |
|------|------|
| 作成日 | 2026-06-19 |
| 担当 | モドリッチ |
| 関連要求 | `.steering/20260619-egg-auto-hatch/requirements.md` |

---

## 1. 概要

### 設計方針サマリ

- **目的**: 卵（stage 0）のふ化をタップ不要にし、`canEvolve` 成立と同時に自動でふ化させる
- **方式**: App.tsx の2箇所（tick ループ・canEvolve useEffect）で stage 0 を検出して `evolveCreature` を直接呼ぶ。ActionButtons から卵専用ボタンを削除する
- **最小スコープ厳守**: minAge の変更なし。ベイビー以降の進化フロー変更なし
- **既存資産は壊さない**: `canEvolve` / `evolveCreature` / `pendingEvolution` フローはベイビー以降で維持

---

## 2. 変更箇所

### 2.1 `App.tsx` — tick ループ（line 94付近）

```ts
// 変更前
if (canEvolve(updated)) {
  setPendingEvolution(true)
}

// 変更後
if (canEvolve(updated)) {
  if (updated.evolutionStage === 0) {
    const evolved = evolveCreature(updated)
    setEvolvedFrom(0)
    persistActiveCreature(evolved)
    setPendingEvolution(false)
    setScreen('evolution')
  } else {
    setPendingEvolution(true)
  }
}
```

tick ループ内では `updated`（最新状態）を直接 `evolveCreature` に渡す。
`handleEvolve` を呼ばない理由: React state は非同期更新のため、同一コールバック内では `creatureRef.current` がまだ古い値を指している可能性がある。

### 2.2 `App.tsx` — canEvolve useEffect（line 109付近）

```ts
// 変更前
useEffect(() => {
  if (activeCreature && screen === 'main') {
    if (canEvolve(activeCreature)) {
      setPendingEvolution(true)
    } else {
      setPendingEvolution(false)
    }
  }
}, [activeCreature, screen])

// 変更後
useEffect(() => {
  if (activeCreature && screen === 'main') {
    if (canEvolve(activeCreature)) {
      if (activeCreature.evolutionStage === 0) {
        handleEvolve()
      } else {
        setPendingEvolution(true)
      }
    } else {
      setPendingEvolution(false)
    }
  }
}, [activeCreature, screen, handleEvolve])
```

こちらは `activeCreature`（React state 由来）を使うため `handleEvolve()` で問題ない。
ref sync useEffect（line 49）が先に走るため、`creatureRef.current` は `activeCreature` と同値になっている。

### 2.3 `ActionButtons.tsx` — 卵ボタン削除（line 70-97付近）

```tsx
// 変更前: 卵ステージで "タップして生まれる！" ボタンを返していた
if (isEgg) {
  return ( <button onClick={onEvolve}>タップして生まれる！</button> )
}

// 変更後: null を返す（自動ふ化するため表示不要）
if (isEgg) {
  return null
}
```

---

## 3. 影響範囲

| ファイル | 種別 | 内容 |
|---------|------|------|
| `frontend/src/App.tsx` | 変更 | tick / useEffect で stage 0 自動ふ化 |
| `frontend/src/components/ActionButtons.tsx` | 変更 | 卵ボタン削除 |

### 既存機能への影響

| 機能 | 影響 |
|------|------|
| ベイビー以降の進化（タップ） | なし（`else` 分岐で従来通り） |
| 死亡・スリープ時のガード | なし（`canEvolve` の既存ガードが有効） |
| 進化演出画面 | なし（同じ `setScreen('evolution')` を通る） |

---

作成: モドリッチ / 2026-06-19

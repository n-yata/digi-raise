# テスト実装計画書 — デジレイズ (DigiRaise)

作成日: 2026-04-04

---

## 1. テスト戦略

### フレームワーク選定

| フレームワーク | 採用 | 理由 |
|---|---|---|
| **Vitest** | 採用 | Vite と同一設定ファイル共有、ESModule ネイティブ対応、TypeScript をゼロ設定で扱える |
| **@testing-library/react** | 採用 | React コンポーネントを DOM 視点でテストする標準ライブラリ |
| **@testing-library/user-event** | 採用 | クリック・入力などのユーザー操作をリアルにシミュレート |
| **jsdom** | 採用 | Vitest の test environment として DOM API を提供 |
| **fake-indexeddb** | 採用 | IndexedDB を Node.js 環境でモックする（idb ライブラリと完全互換） |
| Jest | 不採用 | Vite プロジェクトとの設定統合が複雑、ESModule 変換コストが高い |

### テストの種類と対象方針

```
ユニットテスト（優先）
  対象: utils/, data/ 内の純粋関数
  方針: 外部依存なし、入力と出力を直接検証する

統合テスト（hooks）
  対象: useGameState, useTimeUpdate
  方針: renderHook + act を使い、状態遷移のシーケンスを検証する

コンポーネントテスト
  対象: 主要なインタラクティブコンポーネント
  方針: DOM 上のレンダリングとユーザー操作の結果を検証する

E2E テスト
  Phase 4 以降。ゲームフロー全体の検証が目的。当面は対象外。
```

---

## 2. 環境セットアップ手順

### 2-1. パッケージのインストール

```bash
cd frontend

npm install --save-dev \
  vitest \
  @vitest/coverage-v8 \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom \
  fake-indexeddb
```

### 2-2. vite.config.ts への追記

`frontend/vite.config.ts` の `defineConfig` に `test` ブロックを追加する。

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/digi-raise/',
  plugins: [react(), VitePWA({ /* 既存の設定 */ })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/utils/**', 'src/hooks/**'],
      exclude: ['src/test/**'],
    },
  },
})
```

### 2-3. テストセットアップファイルの作成

`frontend/src/test/setup.ts` を作成する。

```ts
import '@testing-library/jest-dom'
```

### 2-4. tsconfig.json の更新

`frontend/tsconfig.json` の `compilerOptions` に以下を追記する。

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 2-5. package.json へのスクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 3. テスト優先度と対象

### Phase 1（最優先）: ユニットテスト — utils/

ゲームロジックの核心部分。副作用がなく、テストコストが最も低い。

| ファイル | 対象関数 | 優先度 |
|---|---|---|
| `battleLogic.ts` | `createRng`, `calcDamage`, `calcSpecial`, `resolveTurn` | 最高 |
| `gameLogic.ts` | `createNewCreature`, `feedCreature`, `trainCreature`, `applyTimeUpdate` | 最高 |
| `evolution.ts` | `canEvolve`, `evolveCreature`, `getEvolutionProgress` | 高 |

### Phase 2: ユニットテスト — hooks/

useReducer ベースの状態管理。`renderHook` で検証する。

| ファイル | 検証ポイント |
|---|---|
| `useGameState` | アクション（feed, train, evolve 等）が正しい状態遷移を起こすか |
| `useTimeUpdate` | 時間経過による状態更新が正しく発火するか |

### Phase 3: コンポーネントテスト

| コンポーネント | 検証ポイント |
|---|---|
| `CreatureSetup` | 名前未入力・タイプ未選択時のバリデーション、正常作成時のコールバック |
| `StatusScreen` | HP・満腹度・幸福度の表示、クリティカルな値（hunger=0 等）での警告表示 |
| `MainGame` | ごはん・遊ぶ・ねる各ボタンの押下でコールバックが呼ばれるか |

### Phase 4: 統合テスト（ゲームフロー全体）

- 孵化 → 育成 → 進化 → 死 のライフサイクル一連テスト
- 対象: hooks と utils を組み合わせたシナリオテスト

---

## 4. テストファイルの配置場所

```
frontend/src/
├── utils/
│   └── __tests__/
│       ├── battleLogic.test.ts
│       ├── gameLogic.test.ts
│       └── evolution.test.ts
├── hooks/
│   └── __tests__/
│       ├── useGameState.test.ts
│       └── useTimeUpdate.test.ts
├── components/
│   └── __tests__/
│       ├── CreatureSetup.test.tsx
│       ├── StatusScreen.test.tsx
│       └── MainGame.test.tsx
└── test/
    └── setup.ts        ← @testing-library/jest-dom のセットアップ
```

---

## 5. 重要なテストケース例

### Phase 1: battleLogic.test.ts

```ts
import { describe, it, expect } from 'vitest'
import { createRng, calcDamage, calcSpecial, resolveTurn } from '../battleLogic'

// --- createRng ---
describe('createRng', () => {
  it('同じシードから同じ乱数列を生成する（再現性）', () => {
    const rng1 = createRng(12345)
    const rng2 = createRng(12345)
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
  })

  it('生成値は 0 以上 1 未満の範囲に収まる', () => {
    const rng = createRng(99)
    for (let i = 0; i < 100; i++) {
      const val = rng()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

// --- calcDamage ---
describe('calcDamage', () => {
  const baseAttacker = { name: 'A', type: 'Fire', hp: 100, maxHp: 100, atk: 20, def: 10, spd: 10 }
  const baseDefender = { name: 'B', type: 'Plant', hp: 100, maxHp: 100, atk: 10, def: 10, spd: 10 }

  it('ガード中の防御側は受けるダメージが減少する', () => {
    const dmgNormal = calcDamage(baseAttacker, baseDefender, false)
    const dmgGuarded = calcDamage(baseAttacker, baseDefender, true)
    expect(dmgGuarded).toBeLessThan(dmgNormal)
  })

  it('タイプ相性有利（Fire vs Plant）はダメージが増加する', () => {
    const dmgAdvantage = calcDamage(baseAttacker, baseDefender, false) // Fire vs Plant = 1.5
    const dmgNeutral = calcDamage(
      { ...baseAttacker, type: 'Dark' },
      { ...baseDefender, type: 'Dark' },
      false
    )
    expect(dmgAdvantage).toBeGreaterThan(dmgNeutral)
  })

  it('ダメージは最低でも 1 を返す', () => {
    const weakAttacker = { ...baseAttacker, atk: 1 }
    const strongDefender = { ...baseDefender, def: 999 }
    expect(calcDamage(weakAttacker, strongDefender, false)).toBe(1)
  })

  it('速度が高い方が速度補正 1.1 を受ける', () => {
    const fasterAttacker = { ...baseAttacker, spd: 99 }
    const slowerAttacker = { ...baseAttacker, spd: 1 }
    const dmgFaster = calcDamage(fasterAttacker, baseDefender, false)
    const dmgSlower = calcDamage(slowerAttacker, baseDefender, false)
    expect(dmgFaster).toBeGreaterThan(dmgSlower)
  })
})

// --- calcSpecial ---
describe('calcSpecial', () => {
  const rng = createRng(0)
  const defender = { name: 'B', type: 'Water', hp: 100, maxHp: 100, atk: 10, def: 10, spd: 10 }

  it('Fire タイプは atk * 2.5 のダメージを返す', () => {
    const attacker = { name: 'A', type: 'Fire', hp: 100, maxHp: 100, atk: 20, def: 10, spd: 10 }
    const result = calcSpecial(attacker, defender, rng)
    expect(result.damage).toBe(Math.floor(20 * 2.5))
    expect(result.selfHeal).toBe(0)
  })

  it('Water タイプは selfHeal を返し、ダメージは 0', () => {
    const attacker = { name: 'A', type: 'Water', hp: 100, maxHp: 100, atk: 20, def: 10, spd: 10 }
    const result = calcSpecial(attacker, defender, rng)
    expect(result.selfHeal).toBeGreaterThan(0)
    expect(result.damage).toBe(0)
  })

  it('Plant タイプは 3 ターンの毒を付与する', () => {
    const attacker = { name: 'A', type: 'Plant', hp: 100, maxHp: 100, atk: 20, def: 10, spd: 10 }
    const result = calcSpecial(attacker, defender, rng)
    expect(result.poisonTurns).toBe(3)
  })
})

// --- resolveTurn ---
describe('resolveTurn', () => {
  const myCreature = { name: '自分', type: 'Fire', hp: 100, maxHp: 100, atk: 20, def: 10, spd: 15 }
  const opponentCreature = { name: '相手', type: 'Water', hp: 100, maxHp: 100, atk: 15, def: 10, spd: 10 }
  const defaultEffects = {
    myPoisonTurns: 0, opponentPoisonTurns: 0,
    myParalyzed: false, opponentParalyzed: false,
    myDefBuff: 0, opponentDefBuff: 0,
    specialCooldown: 0, opponentSpecialCooldown: 0,
  }

  it('同じシード・同じ入力で同一の結果を返す（決定論的）', () => {
    const result1 = resolveTurn(myCreature, opponentCreature, 'attack', 'attack', 'host', 42, defaultEffects)
    const result2 = resolveTurn(myCreature, opponentCreature, 'attack', 'attack', 'host', 42, defaultEffects)
    expect(result1).toEqual(result2)
  })

  it('attack vs guard: ガード側の HP 減少はガードなしより少ない', () => {
    const resultGuarded = resolveTurn(myCreature, opponentCreature, 'attack', 'guard', 'host', 1, defaultEffects)
    const resultNoGuard = resolveTurn(myCreature, opponentCreature, 'attack', 'attack', 'host', 1, defaultEffects)
    expect(resultGuarded.opponentHpAfter).toBeGreaterThanOrEqual(resultNoGuard.opponentHpAfter)
  })

  it('HP が 0 以下にならない（アンダーフロー防止）', () => {
    const weakOpponent = { ...opponentCreature, hp: 1 }
    const result = resolveTurn(myCreature, weakOpponent, 'attack', 'attack', 'host', 1, defaultEffects)
    expect(result.opponentHpAfter).toBeGreaterThanOrEqual(0)
  })
})
```

### Phase 1: gameLogic.test.ts

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createNewCreature,
  feedCreature,
  trainCreature,
  applyTimeUpdate,
  toggleSleep,
  getAnimationState,
} from '../gameLogic'
import type { Creature } from '../../types/creature'

// テスト用クリーチャーのファクトリ
function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
    name: 'テスト',
    type: 'Fire',
    evolutionStage: 1,
    level: 1,
    exp: 0,
    hp: 40,
    maxHp: 40,
    atk: 5,
    def: 5,
    spd: 5,
    hunger: 80,
    happiness: 70,
    age: 1,
    weight: 10,
    isSleeping: false,
    isAlive: true,
    lastUpdated: Date.now(),
    evolutionName: 'ホノカ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

// --- createNewCreature ---
describe('createNewCreature', () => {
  it('指定した名前とタイプでクリーチャーを生成する', () => {
    const creature = createNewCreature('テスト', 'Water')
    expect(creature.name).toBe('テスト')
    expect(creature.type).toBe('Water')
  })

  it('初期状態: isAlive=true, isSleeping=false', () => {
    const creature = createNewCreature('テスト', 'Fire')
    expect(creature.isAlive).toBe(true)
    expect(creature.isSleeping).toBe(false)
  })

  it('初期 age は 0', () => {
    const creature = createNewCreature('テスト', 'Fire')
    expect(creature.age).toBe(0)
  })
})

// --- feedCreature ---
describe('feedCreature', () => {
  it('hunger と happiness が増加し、feedCount が +1 される', () => {
    const before = makeCreature({ hunger: 50, happiness: 50, feedCount: 0 })
    const after = feedCreature(before)
    expect(after.hunger).toBeGreaterThan(before.hunger)
    expect(after.happiness).toBeGreaterThan(before.happiness)
    expect(after.feedCount).toBe(1)
  })

  it('EXP は増加しない（ごはんは EXP 付与なし）', () => {
    const before = makeCreature({ exp: 10 })
    const after = feedCreature(before)
    expect(after.exp).toBe(before.exp)
  })

  it('過食状態（hunger >= 90）ではウェイトが多く増える', () => {
    const normal = makeCreature({ hunger: 50, weight: 10 })
    const overfed = makeCreature({ hunger: 95, weight: 10 })
    const afterNormal = feedCreature(normal)
    const afterOverfed = feedCreature(overfed)
    expect(afterOverfed.weight - overfed.weight).toBeGreaterThan(afterNormal.weight - normal.weight)
  })

  it('hunger は 100 を超えない', () => {
    const creature = makeCreature({ hunger: 90 })
    const after = feedCreature(creature)
    expect(after.hunger).toBeLessThanOrEqual(100)
  })

  it('isAlive=false のクリーチャーには何もしない', () => {
    const dead = makeCreature({ isAlive: false, hunger: 50 })
    const after = feedCreature(dead)
    expect(after.hunger).toBe(dead.hunger)
  })

  it('isSleeping=true のクリーチャーには何もしない', () => {
    const sleeping = makeCreature({ isSleeping: true, hunger: 50 })
    const after = feedCreature(sleeping)
    expect(after.hunger).toBe(sleeping.hunger)
  })
})

// --- trainCreature ---
describe('trainCreature', () => {
  it('成功時: atk/def/spd が増加し、EXP が加算される', () => {
    const before = makeCreature({ atk: 10, def: 10, spd: 10, exp: 0 })
    const after = trainCreature(before, true)
    expect(after.atk).toBeGreaterThanOrEqual(before.atk)
    expect(after.def).toBeGreaterThanOrEqual(before.def)
    expect(after.spd).toBeGreaterThanOrEqual(before.spd)
    expect(after.exp).toBeGreaterThan(before.exp)
  })

  it('失敗時: EXP 付与量は成功より少ない', () => {
    const base = makeCreature({ exp: 0 })
    const successCreature = trainCreature({ ...base }, true)
    const failCreature = trainCreature({ ...base }, false)
    expect(successCreature.exp).toBeGreaterThan(failCreature.exp)
  })

  it('訓練後 hunger が減少する', () => {
    const before = makeCreature({ hunger: 80 })
    const after = trainCreature(before, true)
    expect(after.hunger).toBeLessThan(before.hunger)
  })

  it('trainCount が +1 される', () => {
    const before = makeCreature({ trainCount: 5 })
    const after = trainCreature(before, true)
    expect(after.trainCount).toBe(6)
  })
})

// --- applyTimeUpdate ---
describe('applyTimeUpdate', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('30分が経過すると hunger が 5 減少する（通常モード）', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ hunger: 80, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 30)
    const after = applyTimeUpdate(creature, false)
    expect(after.hunger).toBe(75)
  })

  it('30分が経過すると age が 0.5 増加する', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ age: 1.0, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 30)
    const after = applyTimeUpdate(creature, false)
    expect(after.age).toBeCloseTo(1.5)
  })

  it('devMode=true では 30 秒 = 30 分相当として処理される', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ hunger: 80, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 30)
    const after = applyTimeUpdate(creature, true)
    expect(after.hunger).toBe(75)
  })

  it('hunger=0 の状態で時間が経過すると HP が減少する（飢餓ダメージ）', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ hunger: 0, hp: 40, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 30)
    const after = applyTimeUpdate(creature, false)
    expect(after.hp).toBeLessThan(creature.hp)
  })

  it('HP が 0 になると isAlive=false になる', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ hunger: 0, hp: 1, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 30)
    const after = applyTimeUpdate(creature, false)
    expect(after.isAlive).toBe(false)
    expect(after.hp).toBe(0)
  })

  it('睡眠中は HP が回復する', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ isSleeping: true, hp: 20, maxHp: 40, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 30)
    const after = applyTimeUpdate(creature, false)
    expect(after.hp).toBeGreaterThan(creature.hp)
  })

  it('経過時間が 30 分未満の場合、状態は変わらない', () => {
    const baseTime = 1000000000000
    const creature = makeCreature({ hunger: 80, lastUpdated: baseTime })
    vi.spyOn(Date, 'now').mockReturnValue(baseTime + 1000 * 60 * 10) // 10分
    const after = applyTimeUpdate(creature, false)
    expect(after.hunger).toBe(creature.hunger)
  })
})
```

### Phase 1: evolution.test.ts

```ts
import { describe, it, expect } from 'vitest'
import { canEvolve, evolveCreature, getEvolutionProgress } from '../evolution'
import type { Creature } from '../../types/creature'

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
    name: 'テスト',
    type: 'Fire',
    evolutionStage: 1,
    level: 1,
    exp: 0,
    hp: 40,
    maxHp: 40,
    atk: 5,
    def: 5,
    spd: 5,
    hunger: 80,
    happiness: 70,
    age: 2,
    weight: 10,
    isSleeping: false,
    isAlive: true,
    lastUpdated: Date.now(),
    evolutionName: 'ホノカ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

// --- canEvolve ---
describe('canEvolve', () => {
  it('全条件を満たしていれば true を返す（Stage1 -> Stage2: age>=1）', () => {
    const creature = makeCreature({ evolutionStage: 1, age: 1 })
    expect(canEvolve(creature)).toBe(true)
  })

  it('age が不足していると false を返す', () => {
    const creature = makeCreature({ evolutionStage: 1, age: 0.5 })
    expect(canEvolve(creature)).toBe(false)
  })

  it('Stage2 -> Stage3 は happiness 条件（>=50）が必要', () => {
    const meets = makeCreature({ evolutionStage: 2, age: 3, happiness: 50 })
    const fails = makeCreature({ evolutionStage: 2, age: 3, happiness: 49 })
    expect(canEvolve(meets)).toBe(true)
    expect(canEvolve(fails)).toBe(false)
  })

  it('evolutionStage=5 の場合は false（最終進化）', () => {
    const creature = makeCreature({ evolutionStage: 5 as any, age: 100 })
    expect(canEvolve(creature)).toBe(false)
  })

  it('isAlive=false の場合は false', () => {
    const creature = makeCreature({ isAlive: false, age: 10 })
    expect(canEvolve(creature)).toBe(false)
  })

  it('isSleeping=true の場合は false', () => {
    const creature = makeCreature({ isSleeping: true, age: 10 })
    expect(canEvolve(creature)).toBe(false)
  })
})

// --- evolveCreature ---
describe('evolveCreature', () => {
  it('evolutionStage が 1 増加する', () => {
    const before = makeCreature({ evolutionStage: 1 })
    const after = evolveCreature(before)
    expect(after.evolutionStage).toBe(2)
  })

  it('進化後の HP は BASE_STATS の値以上になる', () => {
    const before = makeCreature({ evolutionStage: 1 })
    const after = evolveCreature(before)
    expect(after.maxHp).toBeGreaterThan(before.maxHp)
    expect(after.hp).toBe(after.maxHp)
  })

  it('atk/def/spd は進化前より必ず増加する（現在値 + ボーナス vs BASE_STATS の大きい方）', () => {
    const before = makeCreature({ evolutionStage: 1, atk: 5, def: 5, spd: 5 })
    const after = evolveCreature(before)
    expect(after.atk).toBeGreaterThan(before.atk)
    expect(after.def).toBeGreaterThan(before.def)
    expect(after.spd).toBeGreaterThan(before.spd)
  })
})

// --- getEvolutionProgress ---
describe('getEvolutionProgress', () => {
  it('evolutionStage=5 では空配列を返す', () => {
    const creature = makeCreature({ evolutionStage: 5 as any })
    expect(getEvolutionProgress(creature)).toHaveLength(0)
  })

  it('Stage1 の進化条件チェック: age 項目が含まれる', () => {
    const creature = makeCreature({ evolutionStage: 1, age: 1 })
    const progress = getEvolutionProgress(creature)
    const ageCheck = progress.find(p => p.label === '年齢')
    expect(ageCheck).toBeDefined()
    expect(ageCheck?.met).toBe(true)
  })

  it('条件未達のチェック項目は met=false になる', () => {
    const creature = makeCreature({ evolutionStage: 2, age: 1, happiness: 30 }) // age 不足
    const progress = getEvolutionProgress(creature)
    const ageCheck = progress.find(p => p.label === '年齢')
    expect(ageCheck?.met).toBe(false)
  })
})
```

---

## 6. モック戦略

### IndexedDB のモック（fake-indexeddb）

`storage.ts` は idb ライブラリ経由で IndexedDB を操作する。
Node.js / jsdom 環境では IndexedDB が存在しないため、`fake-indexeddb` で差し替える。

```ts
// frontend/src/utils/__tests__/storage.test.ts
import 'fake-indexeddb/auto'  // 先頭でインポートするだけで globalThis.indexedDB が置き換わる
import { saveCreature, loadCreature, deleteCreature } from '../storage'
```

`fake-indexeddb/auto` をインポートするだけで `globalThis.indexedDB` が置き換わるため、
`storage.ts` 側のコードは変更不要。

テスト間のデータ汚染を防ぐため、各テストの `beforeEach` で DB を再初期化する。

```ts
import { IDBFactory } from 'fake-indexeddb'
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
```

### WebSocket のモック

`useBattleWebSocket.ts` のテストでは Vitest の `vi.fn()` で WebSocket クラスをモックする。

```ts
const mockSend = vi.fn()
const mockClose = vi.fn()
vi.stubGlobal('WebSocket', vi.fn(() => ({
  send: mockSend,
  close: mockClose,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})))
```

Phase 1 〜 2 の範囲では WebSocket に依存する `useBattleWebSocket` のテストは対象外とし、
Phase 4 の統合テスト時に実装する。

### 時間（Date.now）のモック

`applyTimeUpdate` や `createNewCreature` は `Date.now()` を内部で呼ぶ。
Vitest の `vi.spyOn` で差し替える。

```ts
import { vi, afterEach } from 'vitest'

const BASE_TIME = 1000000000000

afterEach(() => vi.restoreAllMocks())

it('時間経過テスト例', () => {
  vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 30) // 30分後
  // ...
})
```

`vi.useFakeTimers()` は `setInterval` / `setTimeout` を制御する際に使用する。
`useTimeUpdate` のフックテストではこちらを使う。

```ts
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('タイマーが発火すると状態が更新される', () => {
  // renderHook でフックをマウントし、vi.advanceTimersByTime で時間を進める
  vi.advanceTimersByTime(1000 * 30) // devMode=true で 30秒 = 30分相当
})
```

---

## 7. CI/CD への統合方針

### GitHub Actions ワークフロー

`.github/workflows/test.yml` を新規作成する。

```yaml
name: Test

on:
  push:
    branches: [main, 'claude/**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: frontend/coverage/
```

### 既存 CI との統合順序

1. 現在の `.github/workflows/` 内のビルドワークフローを確認する
2. テストジョブを既存ワークフローの `build` ジョブの前段として追加するか、別ファイルで並列実行する
3. Phase 1 完了後に CI 統合を実施し、テストが全パスすることを確認してからマージ条件に加える

### カバレッジ目標

| Phase | 対象 | 目標カバレッジ |
|---|---|---|
| Phase 1 完了時 | `utils/` | ステートメント 80% 以上 |
| Phase 2 完了時 | `utils/` + `hooks/` | ステートメント 75% 以上 |
| Phase 3 完了時 | 全体 | ステートメント 70% 以上 |

カバレッジはあくまで指標。重要なのは境界値・異常系が網羅されていること。

---

## 実装着手の順序（推奨）

1. 環境セットアップ（Section 2 の手順を実施）
2. `npm run test` が空の状態で起動することを確認
3. `battleLogic.test.ts` の `createRng` テストから着手（最も依存が少ない）
4. `calcDamage` → `calcSpecial` → `resolveTurn` の順に追加
5. `gameLogic.test.ts` を実装（`feedCreature` のみ通過を確認後、他に拡張）
6. `evolution.test.ts` を実装
7. Phase 1 テストが全パスしたら GitHub Actions に組み込む
8. Phase 2 以降は上記を繰り返す

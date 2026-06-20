import { describe, it, expect } from 'vitest'
import type { Creature, CreatureId } from '../types/creature'
import { canEvolve, evolveCreature, getEvolutionProgress, determineEvolutionTarget } from './evolution'

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1000',
    name: 'プティ',
    creatureId: 'baby',
    evolutionStage: 1,
    level: 1,
    exp: 0,
    hp: 40,
    maxHp: 40,
    atk: 5,
    def: 5,
    spd: 5,
    hunger: 60,
    happiness: 60,
    age: 2,
    weight: 10,
    isSleeping: false,
    isAlive: true,
    lastUpdated: 1000000,
    evolutionName: 'プティ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

// ----------------------------------------------------------------
// 1. determineEvolutionTarget
// ----------------------------------------------------------------
describe('determineEvolutionTarget', () => {
  describe('egg → baby', () => {
    it('egg は常に baby に進化する', () => {
      const creature = makeCreature({ creatureId: 'egg', evolutionStage: 0 })
      expect(determineEvolutionTarget(creature)).toBe('baby')
    })
  })

  describe('baby → child（幸福度3分岐）', () => {
    it('happiness >= 70 → childA（善/ルーチェ）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 70 }))).toBe('childA')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 71 }))).toBe('childA')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 100 }))).toBe('childA')
    })

    it('happiness <= 30 → childB（悪/モルテ）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 30 }))).toBe('childB')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 29 }))).toBe('childB')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 0 }))).toBe('childB')
    })

    it('happiness 31〜69 → childC（中間/ゼファ）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 31 }))).toBe('childC')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 50 }))).toBe('childC')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 69 }))).toBe('childC')
    })

    it('境界値: 30/31 と 69/70 で正しく分岐する', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 30 }))).toBe('childB')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 31 }))).toBe('childC')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 69 }))).toBe('childC')
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'baby', happiness: 70 }))).toBe('childA')
    })
  })

  describe('child → adult（幸福度2分岐）', () => {
    const childIds: CreatureId[] = ['childA', 'childB', 'childC']
    const highRoad: Record<string, CreatureId> = { childA: 'adultA1', childB: 'adultB1', childC: 'adultC1' }
    const lowRoad:  Record<string, CreatureId> = { childA: 'adultA2', childB: 'adultB2', childC: 'adultC2' }

    for (const childId of childIds) {
      it(`${childId}: happiness >= 70 → 高道（1）`, () => {
        const creature = makeCreature({ creatureId: childId, evolutionStage: 2, happiness: 70 })
        expect(determineEvolutionTarget(creature)).toBe(highRoad[childId])
      })

      it(`${childId}: happiness < 70 → 低道（2）`, () => {
        const creature = makeCreature({ creatureId: childId, evolutionStage: 2, happiness: 69 })
        expect(determineEvolutionTarget(creature)).toBe(lowRoad[childId])
      })
    }
  })

  describe('adult → perfect（1対1）', () => {
    const cases: [CreatureId, CreatureId][] = [
      ['adultA1', 'perfectA1'], ['adultA2', 'perfectA2'],
      ['adultB1', 'perfectB1'], ['adultB2', 'perfectB2'],
      ['adultC1', 'perfectC1'], ['adultC2', 'perfectC2'],
    ]
    for (const [from, to] of cases) {
      it(`${from} → ${to}`, () => {
        const creature = makeCreature({ creatureId: from, evolutionStage: 3 })
        expect(determineEvolutionTarget(creature)).toBe(to)
      })
    }
  })

  describe('perfect → ultimate（1系のみ）', () => {
    it('perfectA1 → ultimateA', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectA1', evolutionStage: 4 }))).toBe('ultimateA')
    })
    it('perfectB1 → ultimateB', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectB1', evolutionStage: 4 }))).toBe('ultimateB')
    })
    it('perfectC1 → ultimateC', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectC1', evolutionStage: 4 }))).toBe('ultimateC')
    })

    it('perfectA2 は終点（null）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectA2', evolutionStage: 4 }))).toBeNull()
    })
    it('perfectB2 は終点（null）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectB2', evolutionStage: 4 }))).toBeNull()
    })
    it('perfectC2 は終点（null）', () => {
      expect(determineEvolutionTarget(makeCreature({ creatureId: 'perfectC2', evolutionStage: 4 }))).toBeNull()
    })
  })

  describe('ultimate は進化不可', () => {
    const ultimates: CreatureId[] = ['ultimateA', 'ultimateB', 'ultimateC']
    for (const id of ultimates) {
      it(`${id} は null を返す`, () => {
        expect(determineEvolutionTarget(makeCreature({ creatureId: id, evolutionStage: 5 }))).toBeNull()
      })
    }
  })
})

// ----------------------------------------------------------------
// 2. canEvolve
// ----------------------------------------------------------------
describe('canEvolve', () => {
  describe('stage 0 (Egg → Baby, minAge:0)', () => {
    it('age:0 でも即時進化できる', () => {
      const creature = makeCreature({ creatureId: 'egg', evolutionStage: 0, age: 0 })
      expect(canEvolve(creature)).toBe(true)
    })
  })

  describe('stage 1 (Baby → Child, minAge:1)', () => {
    it('age >= 1 のとき true を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 1 }))).toBe(true)
    })

    it('age < 1 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 0.5 }))).toBe(false)
    })
  })

  describe('stage 2 (Child → Adult, minAge:3, minHappiness:50)', () => {
    it('age>=3 かつ happiness>=50 のとき true を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'childA', evolutionStage: 2, age: 3, happiness: 50 }))).toBe(true)
    })

    it('age < 3 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'childA', evolutionStage: 2, age: 2, happiness: 50 }))).toBe(false)
    })

    it('happiness < 50 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'childA', evolutionStage: 2, age: 3, happiness: 49 }))).toBe(false)
    })
  })

  describe('stage 3 (Adult → Perfect, minAge:6, minLevel:8, minCombatStats:40)', () => {
    it('全条件を満たすとき true を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'adultA1', evolutionStage: 3, age: 6, level: 8, atk: 15, def: 15, spd: 10 }))).toBe(true)
    })

    it('age < 6 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'adultA1', evolutionStage: 3, age: 5, level: 8, atk: 15, def: 15, spd: 10 }))).toBe(false)
    })

    it('level < 8 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'adultA1', evolutionStage: 3, age: 6, level: 7, atk: 15, def: 15, spd: 10 }))).toBe(false)
    })

    it('atk+def+spd < 40 のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'adultA1', evolutionStage: 3, age: 6, level: 8, atk: 10, def: 10, spd: 10 }))).toBe(false)
    })
  })

  describe('stage 4 (Perfect1 → Ultimate)', () => {
    it('perfectA1: 全条件を満たすとき true を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'perfectA1', evolutionStage: 4, age: 12, level: 14, atk: 20, def: 20, spd: 20 }))).toBe(true)
    })

    it('perfectA2: 終点のため条件を満たしても false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'perfectA2', evolutionStage: 4, age: 12, level: 14, atk: 20, def: 20, spd: 20 }))).toBe(false)
    })

    it('perfectB2: 終点のため false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'perfectB2', evolutionStage: 4, age: 12, level: 14, atk: 20, def: 20, spd: 20 }))).toBe(false)
    })

    it('perfectC2: 終点のため false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'perfectC2', evolutionStage: 4, age: 12, level: 14, atk: 20, def: 20, spd: 20 }))).toBe(false)
    })
  })

  describe('ultimate（最終進化済み）', () => {
    it('ultimateA は常に false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'ultimateA', evolutionStage: 5, age: 100, level: 99, atk: 100, def: 100, spd: 100 }))).toBe(false)
    })
  })

  describe('共通の前提条件', () => {
    it('isAlive:false のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 5, isAlive: false }))).toBe(false)
    })

    it('isSleeping:true のとき false を返す', () => {
      expect(canEvolve(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 5, isSleeping: true }))).toBe(false)
    })
  })
})

// ----------------------------------------------------------------
// 3. evolveCreature
// ----------------------------------------------------------------
describe('evolveCreature', () => {
  it('baby(happiness:70) → childA に進化する', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('childA')
    expect(result.evolutionStage).toBe(2)
    expect(result.evolutionName).toBe('ルーチェ')
  })

  it('baby(happiness:30) → childB に進化する', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 30 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('childB')
    expect(result.evolutionName).toBe('モルテ')
  })

  it('baby(happiness:50) → childC に進化する', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 50 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('childC')
    expect(result.evolutionName).toBe('ゼファ')
  })

  it('childA(happiness:70) → adultA1（高道）に進化する', () => {
    const creature = makeCreature({ creatureId: 'childA', evolutionStage: 2, happiness: 70 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('adultA1')
    expect(result.evolutionName).toBe('セラフィア')
  })

  it('childA(happiness:69) → adultA2（低道）に進化する', () => {
    const creature = makeCreature({ creatureId: 'childA', evolutionStage: 2, happiness: 69 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('adultA2')
    expect(result.evolutionName).toBe('エリアル')
  })

  it('hp/maxHp が BASE_STATS の値に更新される', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, hp: 40, maxHp: 40 })
    const result = evolveCreature(creature)
    expect(result.maxHp).toBe(80)
    expect(result.hp).toBe(80)
  })

  it('atk は Math.max(creature.atk+8, baseStats.atk) で計算される', () => {
    // stage1→2: baseStats.atk=12, atk=5 → max(13,12)=13
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, atk: 5 })
    expect(evolveCreature(creature).atk).toBe(13)
  })

  it('atk が低いとき baseStats.atk が採用される', () => {
    // stage1→2: baseStats.atk=12, atk=2 → max(10,12)=12
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, atk: 2 })
    expect(evolveCreature(creature).atk).toBe(12)
  })

  it('hunger が 20 増加する（上限100）', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, hunger: 70 })
    expect(evolveCreature(creature).hunger).toBe(90)
  })

  it('hunger の上限は 100 を超えない', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, hunger: 90 })
    expect(evolveCreature(creature).hunger).toBe(100)
  })

  it('happiness が 30 増加する（上限100）', () => {
    const creature = makeCreature({ creatureId: 'baby', evolutionStage: 1, happiness: 70, hunger: 60 })
    const result = evolveCreature(creature)
    expect(result.happiness).toBe(100) // min(70+30, 100)
  })

  it('perfectA2（終点）は進化しない（自分自身を返す）', () => {
    const creature = makeCreature({ creatureId: 'perfectA2', evolutionStage: 4 })
    const result = evolveCreature(creature)
    expect(result.creatureId).toBe('perfectA2')
    expect(result.evolutionStage).toBe(4)
  })
})

// ----------------------------------------------------------------
// 4. getEvolutionProgress
// ----------------------------------------------------------------
describe('getEvolutionProgress', () => {
  it('ultimateA（終点）のとき空配列を返す', () => {
    expect(getEvolutionProgress(makeCreature({ creatureId: 'ultimateA', evolutionStage: 5 }))).toEqual([])
  })

  it('perfectA2（終点）のとき空配列を返す', () => {
    expect(getEvolutionProgress(makeCreature({ creatureId: 'perfectA2', evolutionStage: 4 }))).toEqual([])
  })

  describe('stage 1 (baby → child, minAge:1)', () => {
    it('年齢チェックのみ1件返す', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 0.5 }))
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('年齢')
      expect(result[0].met).toBe(false)
    })

    it('age >= 1 のとき met:true', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'baby', evolutionStage: 1, age: 1 }))
      expect(result[0].met).toBe(true)
    })
  })

  describe('stage 2 (child → adult, minAge:3, minHappiness:50)', () => {
    it('年齢と幸福度の2件を返す', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'childA', evolutionStage: 2, age: 2, happiness: 40 }))
      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('年齢')
      expect(result[1].label).toBe('幸福度')
    })

    it('全条件を満たすとき全て met:true', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'childA', evolutionStage: 2, age: 3, happiness: 50 }))
      expect(result.every(c => c.met)).toBe(true)
    })
  })

  describe('stage 3 (adult → perfect)', () => {
    it('年齢・レベル・戦闘力の3件を返す', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'adultA1', evolutionStage: 3, age: 5, level: 7, atk: 10, def: 10, spd: 10 }))
      expect(result).toHaveLength(3)
      expect(result.map(c => c.label)).toEqual(['年齢', 'レベル', '戦闘力'])
    })
  })

  describe('stage 4 (perfect1 → ultimate)', () => {
    it('perfectA1: 年齢・レベル・最低ステータスの3件を返す', () => {
      const result = getEvolutionProgress(makeCreature({ creatureId: 'perfectA1', evolutionStage: 4, age: 12, level: 14, atk: 20, def: 20, spd: 20 }))
      expect(result).toHaveLength(3)
      expect(result.map(c => c.label)).toEqual(['年齢', 'レベル', '最低ステータス'])
    })
  })
})

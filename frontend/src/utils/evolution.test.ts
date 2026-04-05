import { describe, it, expect } from 'vitest'
import type { Creature } from '../types/creature'
import { canEvolve, evolveCreature, getEvolutionProgress } from './evolution'

// テスト用ヘルパー: 任意ステージのクリーチャーを生成
function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-Fire-1000',
    name: 'テストモン',
    type: 'Fire',
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
    evolutionName: 'ホノカ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

// ----------------------------------------------------------------
// 1. canEvolve
// ----------------------------------------------------------------
describe('canEvolve', () => {
  describe('stage 0 (Egg → Baby, minAge:0)', () => {
    it('age:0 でも即時進化できる (minAge:0)', () => {
      const creature = makeCreature({ evolutionStage: 0, age: 0, isAlive: true })
      expect(canEvolve(creature)).toBe(true)
    })
  })

  describe('stage 1 (Baby → Child, minAge:1)', () => {
    it('age が 1 以上のとき true を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 1, isAlive: true })
      expect(canEvolve(creature)).toBe(true)
    })

    it('age が 1 未満のとき false を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 0.5, isAlive: true })
      expect(canEvolve(creature)).toBe(false)
    })
  })

  describe('stage 2 (Child → Adult, minAge:3, minHappiness:50)', () => {
    it('age>=3 かつ happiness>=50 のとき true を返す', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 50 })
      expect(canEvolve(creature)).toBe(true)
    })

    it('age が 3 未満のとき false を返す', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 2, happiness: 50 })
      expect(canEvolve(creature)).toBe(false)
    })

    it('happiness が 50 未満のとき false を返す', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 49 })
      expect(canEvolve(creature)).toBe(false)
    })
  })

  describe('stage 3 (Adult → Perfect, minAge:6, minLevel:8, minCombatStats:40)', () => {
    it('全条件を満たすとき true を返す', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 6,
        level: 8,
        atk: 15,
        def: 15,
        spd: 10, // atk+def+spd=40
      })
      expect(canEvolve(creature)).toBe(true)
    })

    it('age が 6 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 5,
        level: 8,
        atk: 15,
        def: 15,
        spd: 10,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('level が 8 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 6,
        level: 7,
        atk: 15,
        def: 15,
        spd: 10,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('atk+def+spd が 40 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 6,
        level: 8,
        atk: 10,
        def: 10,
        spd: 10, // 合計30 < 40
      })
      expect(canEvolve(creature)).toBe(false)
    })
  })

  describe('stage 4 (Perfect → Ultimate, minAge:12, minLevel:14, minEachStat:20)', () => {
    it('全条件を満たすとき true を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 20,
        def: 20,
        spd: 20,
      })
      expect(canEvolve(creature)).toBe(true)
    })

    it('age が 12 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 11,
        level: 14,
        atk: 20,
        def: 20,
        spd: 20,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('level が 14 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 13,
        atk: 20,
        def: 20,
        spd: 20,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('atk が 20 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 19,
        def: 20,
        spd: 20,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('def が 20 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 20,
        def: 19,
        spd: 20,
      })
      expect(canEvolve(creature)).toBe(false)
    })

    it('spd が 20 未満のとき false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 20,
        def: 20,
        spd: 19,
      })
      expect(canEvolve(creature)).toBe(false)
    })
  })

  describe('stage 5 (最終進化済み)', () => {
    it('evolutionStage が 5 のとき常に false を返す', () => {
      const creature = makeCreature({
        evolutionStage: 5,
        age: 100,
        level: 99,
        atk: 100,
        def: 100,
        spd: 100,
      })
      expect(canEvolve(creature)).toBe(false)
    })
  })

  describe('共通の前提条件', () => {
    it('isAlive:false のとき false を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 5, isAlive: false })
      expect(canEvolve(creature)).toBe(false)
    })

    it('isSleeping:true のとき false を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 5, isSleeping: true })
      expect(canEvolve(creature)).toBe(false)
    })
  })
})

// ----------------------------------------------------------------
// 2. evolveCreature
// ----------------------------------------------------------------
describe('evolveCreature', () => {
  it('evolutionStage が 1 増加する', () => {
    const creature = makeCreature({ evolutionStage: 1 })
    const result = evolveCreature(creature)
    expect(result.evolutionStage).toBe(2)
  })

  it('stage1 → stage2 進化時に hp/maxHp が BASE_STATS[2] の値(80)になる', () => {
    const creature = makeCreature({ evolutionStage: 1, hp: 40, maxHp: 40 })
    const result = evolveCreature(creature)
    expect(result.maxHp).toBe(80)
    expect(result.hp).toBe(80)
  })

  it('stage0 → stage1 進化時に hp/maxHp が BASE_STATS[1] の値(40)になる', () => {
    const creature = makeCreature({ evolutionStage: 0, hp: 20, maxHp: 20 })
    const result = evolveCreature(creature)
    expect(result.maxHp).toBe(40)
    expect(result.hp).toBe(40)
  })

  it('atk は Math.max(creature.atk+8, baseStats.atk) で計算される', () => {
    // stage1→2: baseStats.atk=12, creature.atk=5 → Math.max(5+8, 12)=Math.max(13,12)=13
    const creature = makeCreature({ evolutionStage: 1, atk: 5 })
    const result = evolveCreature(creature)
    expect(result.atk).toBe(13) // 5+8=13 > baseStats.atk(12)
  })

  it('atk が低いとき baseStats.atk が採用される', () => {
    // stage1→2: baseStats.atk=12, creature.atk=2 → Math.max(2+8, 12)=Math.max(10,12)=12
    const creature = makeCreature({ evolutionStage: 1, atk: 2 })
    const result = evolveCreature(creature)
    expect(result.atk).toBe(12) // baseStats.atk(12) > 2+8=10
  })

  it('def は Math.max(creature.def+6, baseStats.def) で計算される', () => {
    // stage1→2: baseStats.def=10, creature.def=5 → Math.max(5+6, 10)=Math.max(11,10)=11
    const creature = makeCreature({ evolutionStage: 1, def: 5 })
    const result = evolveCreature(creature)
    expect(result.def).toBe(11) // 5+6=11 > baseStats.def(10)
  })

  it('def が低いとき baseStats.def が採用される', () => {
    // stage1→2: baseStats.def=10, creature.def=2 → Math.max(2+6, 10)=Math.max(8,10)=10
    const creature = makeCreature({ evolutionStage: 1, def: 2 })
    const result = evolveCreature(creature)
    expect(result.def).toBe(10) // baseStats.def(10) > 2+6=8
  })

  it('spd は Math.max(creature.spd+6, baseStats.spd) で計算される', () => {
    // stage1→2: baseStats.spd=10, creature.spd=5 → Math.max(5+6, 10)=Math.max(11,10)=11
    const creature = makeCreature({ evolutionStage: 1, spd: 5 })
    const result = evolveCreature(creature)
    expect(result.spd).toBe(11) // 5+6=11 > baseStats.spd(10)
  })

  it('hunger が 20 増加する (上限100)', () => {
    const creature = makeCreature({ evolutionStage: 1, hunger: 70 })
    const result = evolveCreature(creature)
    expect(result.hunger).toBe(90)
  })

  it('hunger の上限は 100 を超えない', () => {
    const creature = makeCreature({ evolutionStage: 1, hunger: 90 })
    const result = evolveCreature(creature)
    expect(result.hunger).toBe(100)
  })

  it('happiness が 30 増加する (上限100)', () => {
    const creature = makeCreature({ evolutionStage: 1, happiness: 50 })
    const result = evolveCreature(creature)
    expect(result.happiness).toBe(80)
  })

  it('happiness の上限は 100 を超えない', () => {
    const creature = makeCreature({ evolutionStage: 1, happiness: 80 })
    const result = evolveCreature(creature)
    expect(result.happiness).toBe(100)
  })

  it('evolutionName が次のステージの名前に更新される (Fire type, stage1→2)', () => {
    const creature = makeCreature({ evolutionStage: 1, type: 'Fire' })
    const result = evolveCreature(creature)
    expect(result.evolutionName).toBe('フレイモン') // EVOLUTION_NAMES.Fire[2]
  })

  it('evolutionName が次のステージの名前に更新される (Water type, stage0→1)', () => {
    const creature = makeCreature({ evolutionStage: 0, type: 'Water' })
    const result = evolveCreature(creature)
    expect(result.evolutionName).toBe('ミズカ') // EVOLUTION_NAMES.Water[1]
  })
})

// ----------------------------------------------------------------
// 3. getEvolutionProgress
// ----------------------------------------------------------------
describe('getEvolutionProgress', () => {
  it('evolutionStage が 5 のとき空配列を返す', () => {
    const creature = makeCreature({ evolutionStage: 5 })
    const result = getEvolutionProgress(creature)
    expect(result).toEqual([])
  })

  describe('stage 1 (Baby → Child, minAge:1)', () => {
    it('年齢チェックのみ1件返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 0.5 })
      const result = getEvolutionProgress(creature)
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('年齢')
    })

    it('age が minAge 未満のとき met:false を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 0.5 })
      const result = getEvolutionProgress(creature)
      expect(result[0].met).toBe(false)
      expect(result[0].max).toBe(1)
    })

    it('age が minAge 以上のとき met:true を返す', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 1 })
      const result = getEvolutionProgress(creature)
      expect(result[0].met).toBe(true)
    })

    it('value は Math.floor(age * 10) / 10 で丸められる', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 0.55 })
      const result = getEvolutionProgress(creature)
      expect(result[0].value).toBe(0.5) // floor(0.55*10)/10 = 5/10 = 0.5
    })
  })

  describe('stage 2 (Child → Adult, minAge:3, minHappiness:50)', () => {
    it('年齢と幸福度の2件を返す', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 2, happiness: 40 })
      const result = getEvolutionProgress(creature)
      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('年齢')
      expect(result[1].label).toBe('幸福度')
    })

    it('happiness の met と max が正しい', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 40 })
      const result = getEvolutionProgress(creature)
      expect(result[1].met).toBe(false)
      expect(result[1].value).toBe(40)
      expect(result[1].max).toBe(50)
    })

    it('条件を全て満たすとき全て met:true', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 50 })
      const result = getEvolutionProgress(creature)
      expect(result.every(c => c.met)).toBe(true)
    })
  })

  describe('stage 3 (Adult → Perfect, minAge:6, minLevel:8, minCombatStats:40)', () => {
    it('年齢・レベル・戦闘力の3件を返す', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 5,
        level: 7,
        atk: 10,
        def: 10,
        spd: 10,
      })
      const result = getEvolutionProgress(creature)
      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('年齢')
      expect(result[1].label).toBe('レベル')
      expect(result[2].label).toBe('戦闘力')
    })

    it('戦闘力の value が atk+def+spd の合計になる', () => {
      const creature = makeCreature({
        evolutionStage: 3,
        age: 6,
        level: 8,
        atk: 12,
        def: 15,
        spd: 13,
      })
      const result = getEvolutionProgress(creature)
      const combatCheck = result.find(c => c.label === '戦闘力')!
      expect(combatCheck.value).toBe(40) // 12+15+13
      expect(combatCheck.max).toBe(40)
      expect(combatCheck.met).toBe(true)
    })
  })

  describe('stage 4 (Perfect → Ultimate, minAge:12, minLevel:14, minEachStat:20)', () => {
    it('年齢・レベル・最低ステータスの3件を返す', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 20,
        def: 20,
        spd: 20,
      })
      const result = getEvolutionProgress(creature)
      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('年齢')
      expect(result[1].label).toBe('レベル')
      expect(result[2].label).toBe('最低ステータス')
    })

    it('最低ステータスの value が Math.min(atk, def, spd) になる', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 25,
        def: 20,
        spd: 18,
      })
      const result = getEvolutionProgress(creature)
      const statCheck = result.find(c => c.label === '最低ステータス')!
      expect(statCheck.value).toBe(18) // Math.min(25, 20, 18)
      expect(statCheck.max).toBe(20)
      expect(statCheck.met).toBe(false) // 18 < 20
    })

    it('全ステータスが minEachStat 以上のとき met:true になる', () => {
      const creature = makeCreature({
        evolutionStage: 4,
        age: 12,
        level: 14,
        atk: 20,
        def: 20,
        spd: 20,
      })
      const result = getEvolutionProgress(creature)
      const statCheck = result.find(c => c.label === '最低ステータス')!
      expect(statCheck.met).toBe(true)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Creature } from '../types/creature'
import {
  createNewCreature,
  feedCreature,
  trainCreature,
  playWithCreature,
  toggleSleep,
  applyTimeUpdate,
  getAnimationState,
} from './gameLogic'

// テスト用ヘルパー: デフォルトのクリーチャーを生成
function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-baby-1000',
    name: 'テストモン',
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
    evolutionName: 'ホノカ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

// ----------------------------------------------------------------
// 1. createNewCreature
// ----------------------------------------------------------------
describe('createNewCreature', () => {
  it('指定した名前でクリーチャーが生成される', () => {
    const creature = createNewCreature('マイモン')
    expect(creature.name).toBe('マイモン')
    expect(creature.creatureId).toBe('egg')
  })

  it('初期ステータスがBASE_STATS[0]の値になる (hp:20, atk:2, def:2, spd:2)', () => {
    const creature = createNewCreature('テスト')
    expect(creature.hp).toBe(20)
    expect(creature.maxHp).toBe(20)
    expect(creature.atk).toBe(2)
    expect(creature.def).toBe(2)
    expect(creature.spd).toBe(2)
  })

  it('初期hunger:80, happiness:70, age:0になる', () => {
    const creature = createNewCreature('テスト')
    expect(creature.hunger).toBe(80)
    expect(creature.happiness).toBe(70)
    expect(creature.age).toBe(0)
  })

  it('isAlive:true, isSleeping:falseで生成される', () => {
    const creature = createNewCreature('テスト')
    expect(creature.isAlive).toBe(true)
    expect(creature.isSleeping).toBe(false)
  })

  it('evolutionStage:0, level:1, exp:0で生成される', () => {
    const creature = createNewCreature('テスト')
    expect(creature.evolutionStage).toBe(0)
    expect(creature.level).toBe(1)
    expect(creature.exp).toBe(0)
  })

  it('evolutionNameがタマゴになる', () => {
    const creature = createNewCreature('テスト')
    expect(creature.evolutionName).toBe('タマゴ')
  })

  it('IDに egg が含まれる', () => {
    const creature = createNewCreature('テスト')
    expect(creature.id).toContain('egg')
  })

  it('trainCount/playCount/feedCount が 0 で生成される', () => {
    const creature = createNewCreature('テスト')
    expect(creature.trainCount).toBe(0)
    expect(creature.playCount).toBe(0)
    expect(creature.feedCount).toBe(0)
  })
})

// ----------------------------------------------------------------
// 2. feedCreature
// ----------------------------------------------------------------
describe('feedCreature', () => {
  it('hunger が 30 増加する (上限100)', () => {
    const creature = makeCreature({ hunger: 50 })
    const result = feedCreature(creature)
    expect(result.hunger).toBe(80)
  })

  it('hunger の上限は 100 を超えない', () => {
    const creature = makeCreature({ hunger: 80 })
    const result = feedCreature(creature)
    expect(result.hunger).toBe(100)
  })

  it('happiness が 5 増加する (上限100)', () => {
    const creature = makeCreature({ happiness: 60 })
    const result = feedCreature(creature)
    expect(result.happiness).toBe(65)
  })

  it('happiness の上限は 100 を超えない', () => {
    const creature = makeCreature({ happiness: 98 })
    const result = feedCreature(creature)
    expect(result.happiness).toBe(100)
  })

  it('hunger が 90 未満のとき weight が 1 増加する', () => {
    const creature = makeCreature({ hunger: 50, weight: 10 })
    const result = feedCreature(creature)
    expect(result.weight).toBe(11)
  })

  it('hunger が 90 以上(過食)のとき weight が 3 増加する', () => {
    const creature = makeCreature({ hunger: 90, weight: 10 })
    const result = feedCreature(creature)
    expect(result.weight).toBe(13)
  })

  it('feedCount が 1 増加する', () => {
    const creature = makeCreature({ feedCount: 3 })
    const result = feedCreature(creature)
    expect(result.feedCount).toBe(4)
  })

  it('EXP は変化しない', () => {
    const creature = makeCreature({ exp: 15 })
    const result = feedCreature(creature)
    expect(result.exp).toBe(15)
  })

  it('isAlive:false のときそのまま返す', () => {
    const creature = makeCreature({ isAlive: false, hunger: 50, feedCount: 0 })
    const result = feedCreature(creature)
    expect(result.hunger).toBe(50)
    expect(result.feedCount).toBe(0)
  })

  it('isSleeping:true のときそのまま返す', () => {
    const creature = makeCreature({ isSleeping: true, hunger: 50, feedCount: 0 })
    const result = feedCreature(creature)
    expect(result.hunger).toBe(50)
    expect(result.feedCount).toBe(0)
  })
})

// ----------------------------------------------------------------
// 3. trainCreature
// ----------------------------------------------------------------
describe('trainCreature', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('タップ数 × 2 の exp を獲得する (10タップ → +20, EXP_TO_LEVEL(1)=20 なのでちょうどレベルアップ)', () => {
    vi.mocked(Math.random).mockReturnValue(0.5) // floor(0.5*3)+1=2
    const creature = makeCreature({ exp: 0, level: 1 })
    const result = trainCreature(creature, 10)
    // exp=0+20=20, EXP_TO_LEVEL(1)=1*20=20 → レベルアップ → exp=0, level=2
    expect(result.exp).toBe(0)
    expect(result.level).toBe(2)
  })

  it('exp はタップ数に比例する (level:5 で 3タップ → +6, 25タップ → +50)', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    // level:5, EXP_TO_LEVEL(5)=100 なのでレベルアップしない
    const few = trainCreature(makeCreature({ exp: 0, level: 5 }), 3)
    const many = trainCreature(makeCreature({ exp: 0, level: 5 }), 25)
    expect(few.exp).toBe(6)
    expect(many.exp).toBe(50)
  })

  it('タップ 0 回のときは何も変化しない', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const creature = makeCreature({ exp: 3, atk: 5, trainCount: 1, hunger: 60 })
    const result = trainCreature(creature, 0)
    expect(result).toBe(creature)
  })

  it('atk/def/spd が 1〜3 増加する (random=0 → +1)', () => {
    vi.mocked(Math.random).mockReturnValue(0) // floor(0*3)+1=1
    const creature = makeCreature({ atk: 5, def: 5, spd: 5 })
    const result = trainCreature(creature, 10)
    expect(result.atk).toBe(6)
    expect(result.def).toBe(6)
    expect(result.spd).toBe(6)
  })

  it('atk/def/spd が 1〜3 増加する (random=0.99 → +3)', () => {
    vi.mocked(Math.random).mockReturnValue(0.99) // floor(0.99*3)+1=3
    const creature = makeCreature({ atk: 5, def: 5, spd: 5 })
    const result = trainCreature(creature, 10)
    expect(result.atk).toBe(8)
    expect(result.def).toBe(8)
    expect(result.spd).toBe(8)
  })

  it('trainCount が 1 増加する', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const creature = makeCreature({ trainCount: 2 })
    const result = trainCreature(creature, 10)
    expect(result.trainCount).toBe(3)
  })

  it('hunger が 10 減少する (下限0)', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const creature = makeCreature({ hunger: 60 })
    const result = trainCreature(creature, 10)
    expect(result.hunger).toBe(50)
  })

  it('hunger の下限は 0 を下回らない', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const creature = makeCreature({ hunger: 5 })
    const result = trainCreature(creature, 10)
    expect(result.hunger).toBe(0)
  })

  it('happiness が 5 減少する (下限0)', () => {
    vi.mocked(Math.random).mockReturnValue(0.5)
    const creature = makeCreature({ happiness: 60 })
    const result = trainCreature(creature, 10)
    expect(result.happiness).toBe(55)
  })

  it('isAlive:false のときそのまま返す', () => {
    const creature = makeCreature({ isAlive: false, trainCount: 0 })
    const result = trainCreature(creature, 10)
    expect(result.trainCount).toBe(0)
  })

  it('isSleeping:true のときそのまま返す', () => {
    const creature = makeCreature({ isSleeping: true, trainCount: 0 })
    const result = trainCreature(creature, 10)
    expect(result.trainCount).toBe(0)
  })
})

// ----------------------------------------------------------------
// 4. playWithCreature
// ----------------------------------------------------------------
describe('playWithCreature', () => {
  it('success=true のとき happiness が 20 増加する', () => {
    const creature = makeCreature({ happiness: 50 })
    const result = playWithCreature(creature, true)
    expect(result.happiness).toBe(70)
  })

  it('success=false のとき happiness が 5 増加する', () => {
    const creature = makeCreature({ happiness: 50 })
    const result = playWithCreature(creature, false)
    expect(result.happiness).toBe(55)
  })

  it('success 省略時(デフォルト true)は happiness が 20 増加する', () => {
    const creature = makeCreature({ happiness: 50 })
    const result = playWithCreature(creature)
    expect(result.happiness).toBe(70)
  })

  it('success=true のとき happiness の上限は 100 を超えない', () => {
    const creature = makeCreature({ happiness: 90 })
    const result = playWithCreature(creature, true)
    expect(result.happiness).toBe(100)
  })

  it('success=false のとき happiness の上限は 100 を超えない', () => {
    const creature = makeCreature({ happiness: 98 })
    const result = playWithCreature(creature, false)
    expect(result.happiness).toBe(100)
  })

  it('hunger が 5 減少する (success=true)', () => {
    const creature = makeCreature({ hunger: 60 })
    const result = playWithCreature(creature, true)
    expect(result.hunger).toBe(55)
  })

  it('hunger が 5 減少する (success=false)', () => {
    const creature = makeCreature({ hunger: 60 })
    const result = playWithCreature(creature, false)
    expect(result.hunger).toBe(55)
  })

  it('hunger の下限は 0 を下回らない', () => {
    const creature = makeCreature({ hunger: 3 })
    const result = playWithCreature(creature, true)
    expect(result.hunger).toBe(0)
  })

  it('EXP は変化しない (success=true)', () => {
    const creature = makeCreature({ exp: 10 })
    const result = playWithCreature(creature, true)
    expect(result.exp).toBe(10)
  })

  it('EXP は変化しない (success=false)', () => {
    const creature = makeCreature({ exp: 10 })
    const result = playWithCreature(creature, false)
    expect(result.exp).toBe(10)
  })

  it('playCount が 1 増加する (success=true)', () => {
    const creature = makeCreature({ playCount: 4 })
    const result = playWithCreature(creature, true)
    expect(result.playCount).toBe(5)
  })

  it('playCount が 1 増加する (success=false)', () => {
    const creature = makeCreature({ playCount: 4 })
    const result = playWithCreature(creature, false)
    expect(result.playCount).toBe(5)
  })

  it('isAlive:false のときそのまま返す', () => {
    const creature = makeCreature({ isAlive: false, playCount: 0 })
    const result = playWithCreature(creature, true)
    expect(result.playCount).toBe(0)
  })

  it('isSleeping:true のときそのまま返す', () => {
    const creature = makeCreature({ isSleeping: true, playCount: 0 })
    const result = playWithCreature(creature, true)
    expect(result.playCount).toBe(0)
  })
})

// ----------------------------------------------------------------
// 5. toggleSleep
// ----------------------------------------------------------------
describe('toggleSleep', () => {
  it('isSleeping:false のとき true に切り替わる', () => {
    const creature = makeCreature({ isSleeping: false })
    const result = toggleSleep(creature)
    expect(result.isSleeping).toBe(true)
  })

  it('isSleeping:true のとき false に切り替わる', () => {
    const creature = makeCreature({ isSleeping: true })
    const result = toggleSleep(creature)
    expect(result.isSleeping).toBe(false)
  })

  it('isAlive:false のときそのまま返す (isSleeping は変化しない)', () => {
    const creature = makeCreature({ isAlive: false, isSleeping: false })
    const result = toggleSleep(creature)
    expect(result.isSleeping).toBe(false)
  })
})

// ----------------------------------------------------------------
// 6. applyTimeUpdate
// ----------------------------------------------------------------
describe('applyTimeUpdate', () => {
  const BASE_TIME = 1000000000000 // 固定ベースタイム

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('経過時間が 30 分未満(ticks=0)のときそのまま返す', () => {
    const creature = makeCreature({ lastUpdated: BASE_TIME, hunger: 60, happiness: 60 })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 29) // 29分後
    const result = applyTimeUpdate(creature, false)
    expect(result.hunger).toBe(60)
    expect(result.happiness).toBe(60)
    expect(result.age).toBe(2)
  })

  it('30 分経過(ticks=1)で hunger-5, happiness-2, age+0.5', () => {
    const creature = makeCreature({ lastUpdated: BASE_TIME, hunger: 60, happiness: 60, age: 2 })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 30) // 30分後
    const result = applyTimeUpdate(creature, false)
    expect(result.hunger).toBe(55)
    expect(result.happiness).toBe(58)
    expect(result.age).toBe(2.5)
  })

  it('60 分経過(ticks=2)で hunger-10, happiness-4, age+1.0', () => {
    const creature = makeCreature({ lastUpdated: BASE_TIME, hunger: 60, happiness: 60, age: 2 })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 60) // 60分後
    const result = applyTimeUpdate(creature, false)
    expect(result.hunger).toBe(50)
    expect(result.happiness).toBe(56)
    expect(result.age).toBe(3)
  })

  it('睡眠中(isSleeping:true)のとき hp が ticks×ceil(maxHp*0.1) 回復する', () => {
    const creature = makeCreature({
      lastUpdated: BASE_TIME,
      isSleeping: true,
      hp: 100,
      maxHp: 150,
    })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 30) // 1 tick
    const result = applyTimeUpdate(creature, false)
    // ceil(150 * 0.1) = 15, 100 + 15 = 115
    expect(result.hp).toBe(115)
  })

  it('睡眠中の hp 回復は maxHp を超えない', () => {
    const creature = makeCreature({
      lastUpdated: BASE_TIME,
      isSleeping: true,
      hp: 38,
      maxHp: 40,
    })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 60) // 2 ticks
    const result = applyTimeUpdate(creature, false)
    // ceil(40 * 0.1) = 4, 38 + 4*2 = 46 → capped at 40
    expect(result.hp).toBe(40)
  })

  it('hunger が 0 になったとき飢餓ダメージで hp が ticks×5 減少する', () => {
    const creature = makeCreature({
      lastUpdated: BASE_TIME,
      hunger: 5,
      hp: 40,
      maxHp: 40,
    })
    // 2 ticks: hunger=5-10=-5 → clamp→0, hp=40-10=30
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 60)
    const result = applyTimeUpdate(creature, false)
    expect(result.hunger).toBe(0)
    expect(result.hp).toBe(30)
  })

  it('hp が 0 以下になったとき isAlive:false かつ hp:0 になる', () => {
    const creature = makeCreature({
      lastUpdated: BASE_TIME,
      hunger: 0,
      hp: 5,
      maxHp: 40,
    })
    // 2 ticks: hunger=0-10 → clamp→0(既に飢餓), hp=5-10=-5 → isAlive=false
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 60)
    const result = applyTimeUpdate(creature, false)
    expect(result.isAlive).toBe(false)
    expect(result.hp).toBe(0)
  })

  it('devMode:true のとき 30 秒が 1 tick になる', () => {
    const creature = makeCreature({ lastUpdated: BASE_TIME, hunger: 60, happiness: 60, age: 0 })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 30) // 30秒後
    const result = applyTimeUpdate(creature, true)
    expect(result.hunger).toBe(55) // 1 tick
    expect(result.age).toBe(0.5)
  })

  it('isAlive:false のときそのまま返す', () => {
    const creature = makeCreature({ isAlive: false, lastUpdated: BASE_TIME, hunger: 60 })
    vi.spyOn(Date, 'now').mockReturnValue(BASE_TIME + 1000 * 60 * 60)
    const result = applyTimeUpdate(creature, false)
    expect(result.hunger).toBe(60)
    expect(result.isAlive).toBe(false)
  })
})

// ----------------------------------------------------------------
// 7. getAnimationState
// ----------------------------------------------------------------
describe('getAnimationState', () => {
  it('isAlive:false のとき "dead" を返す', () => {
    const creature = makeCreature({ isAlive: false })
    expect(getAnimationState(creature, null)).toBe('dead')
  })

  it('actionOverride:"attack" のとき "attack" を返す', () => {
    const creature = makeCreature({ isAlive: true })
    expect(getAnimationState(creature, 'attack')).toBe('attack')
  })

  it('actionOverride:"eating" のとき "eating" を返す', () => {
    const creature = makeCreature({ isAlive: true })
    expect(getAnimationState(creature, 'eating')).toBe('eating')
  })

  it('actionOverride:"happy" のとき "happy" を返す', () => {
    const creature = makeCreature({ isAlive: true, happiness: 50 })
    expect(getAnimationState(creature, 'happy')).toBe('happy')
  })

  it('actionOverride 省略時はデフォルト null として扱われる', () => {
    const creature = makeCreature({ happiness: 50 })
    expect(getAnimationState(creature)).toBe('idle')
  })

  it('isSleeping:true のとき "sleeping" を返す (actionOverride:null)', () => {
    const creature = makeCreature({ isSleeping: true })
    expect(getAnimationState(creature, null)).toBe('sleeping')
  })

  it('happiness > 70 のとき "happy" を返す', () => {
    const creature = makeCreature({ happiness: 71 })
    expect(getAnimationState(creature, null)).toBe('happy')
  })

  it('happiness が 70 ちょうどのとき "idle" を返す', () => {
    const creature = makeCreature({ happiness: 70 })
    expect(getAnimationState(creature, null)).toBe('idle')
  })

  it('happiness < 70 のとき "idle" を返す', () => {
    const creature = makeCreature({ happiness: 50 })
    expect(getAnimationState(creature, null)).toBe('idle')
  })

  it('dead が actionOverride より優先される', () => {
    const creature = makeCreature({ isAlive: false })
    expect(getAnimationState(creature, 'attack')).toBe('dead')
  })

  it('actionOverride が sleeping より優先される', () => {
    const creature = makeCreature({ isSleeping: true })
    expect(getAnimationState(creature, 'attack')).toBe('attack')
  })
})

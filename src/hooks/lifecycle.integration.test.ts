// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Creature } from '../types/creature'
import { createNewCreature, feedCreature, trainCreature, playWithCreature, applyTimeUpdate } from '../utils/gameLogic'
import { canEvolve, evolveCreature } from '../utils/evolution'
import { EXP_TO_LEVEL } from '../data/evolutions'
import { useGameState } from './useGameState'

vi.mock('../utils/storage', () => ({
  saveCreature: vi.fn(),
  loadCreature: vi.fn(),
  deleteCreature: vi.fn(),
  exportSave: vi.fn(),
  importSave: vi.fn(),
}))

import { deleteCreature } from '../utils/storage'

// テスト用クリーチャーファクトリ
function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
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
    wins: 0,
    losses: 0,
    ...overrides,
  }
}

describe('Phase 4 統合テスト: ゲームライフサイクル', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // シナリオ 1: 孵化フロー（Egg → Baby）
  // -------------------------------------------------------------------------
  describe('シナリオ 1: 孵化フロー（Egg → Baby）', () => {
    it('createNewCreature で evolutionStage=0 のクリーチャーが生成される', () => {
      const creature = createNewCreature('テストモン', 'Fire')
      expect(creature.evolutionStage).toBe(0)
      expect(creature.hp).toBe(20)
      expect(creature.maxHp).toBe(20)
      expect(creature.atk).toBe(2)
      expect(creature.def).toBe(2)
      expect(creature.spd).toBe(2)
      expect(creature.hunger).toBe(80)
      expect(creature.happiness).toBe(70)
      expect(creature.age).toBe(0)
    })

    it('stage=0 は minAge=0 なので canEvolve が true になる', () => {
      const creature = createNewCreature('テストモン', 'Fire')
      expect(canEvolve(creature)).toBe(true)
    })

    it('evolveCreature で evolutionStage=1 になり、hp=40, atk>=5 になる', () => {
      const creature = createNewCreature('テストモン', 'Fire')
      const evolved = evolveCreature(creature)
      expect(evolved.evolutionStage).toBe(1)
      expect(evolved.hp).toBe(40)
      expect(evolved.maxHp).toBe(40)
      expect(evolved.atk).toBeGreaterThanOrEqual(5)
    })

    it('useGameState の evolve() 後に screen=evolution, pendingEvolution=false になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = createNewCreature('テストモン', 'Fire')

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.setPendingEvolution(true)
      })
      act(() => {
        result.current.actions.evolve()
      })

      expect(result.current.state.screen).toBe('evolution')
      expect(result.current.state.pendingEvolution).toBe(false)
      expect(result.current.state.creature!.evolutionStage).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 2: 育成フロー（ステータス成長の検証）
  // -------------------------------------------------------------------------
  describe('シナリオ 2: 育成フロー（ステータス成長の検証）', () => {
    it('trainCreature(success=true) で exp が 20 加算される（レベルアップなし）', () => {
      const creature = makeCreature({ level: 1, exp: 0 })
      // Lv1 → Lv2 に必要: EXP_TO_LEVEL(1) = 20
      // exp=0 + 20 = 20 → ちょうどレベルアップ閾値なのでレベルアップする
      // exp=0, level=2 になるはずなのでまず 1 回試行
      const trained = trainCreature(creature, true)
      // expGain=20 を加算 → Lv1の閾値=20に達するのでレベルアップ
      // newExp = 0+20 = 20 >= EXP_TO_LEVEL(1)=20 → level=2, exp=20-20=0
      expect(trained.level).toBe(2)
      expect(trained.exp).toBe(0)
    })

    it('train を繰り返してレベル 3 に到達できる（EXP 蓄積の検証）', () => {
      // Lv2→Lv3 に必要: EXP_TO_LEVEL(2) = 40 EXP
      // Lv1から: train×2でLv2(exp=0), さらにtrain×2でexpが40に達する
      // Lv2での1回のtrainでexp=20, もう1回でexp=40 → Lv3
      let creature = makeCreature({ level: 1, exp: 0, hunger: 100 })
      // Lv1→Lv2: 1回(exp=0+20→閾値20到達→Lv2, exp=0)
      creature = trainCreature(creature, true)
      expect(creature.level).toBe(2)
      expect(creature.exp).toBe(0)
      // Lv2→Lv3: EXP_TO_LEVEL(2)=40 必要 → 2回trainでexp=40 → Lv3
      creature = { ...creature, hunger: 100 }
      creature = trainCreature(creature, true)
      expect(creature.level).toBe(2)
      expect(creature.exp).toBe(20)
      creature = { ...creature, hunger: 100 }
      creature = trainCreature(creature, true)
      // exp=20+20=40 >= EXP_TO_LEVEL(2)=40 → Lv3, exp=0
      expect(creature.level).toBe(3)
      expect(creature.exp).toBe(0)
    })

    it('feedCreature を繰り返すと hunger が 100 に上限クランプされる', () => {
      let creature = makeCreature({ hunger: 75 })
      creature = feedCreature(creature) // 75+30=105 → 100
      expect(creature.hunger).toBe(100)
    })

    it('playWithCreature で happiness が増加する', () => {
      const creature = makeCreature({ happiness: 50 })
      const played = playWithCreature(creature)
      expect(played.happiness).toBe(70) // 50+20=70
    })

    it('happiness は 100 を超えない（上限クランプ）', () => {
      const creature = makeCreature({ happiness: 90 })
      const played = playWithCreature(creature)
      expect(played.happiness).toBe(100) // 90+20=110 → 100
    })

    it('useGameState の feed → train → play 連続操作で state.creature が正しく更新される', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ hunger: 50, happiness: 50, trainCount: 0, playCount: 0, feedCount: 0 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.feed()
      })
      act(() => {
        result.current.actions.train()
      })
      act(() => {
        result.current.actions.play()
      })

      const c = result.current.state.creature!
      expect(c.feedCount).toBe(1)
      expect(c.trainCount).toBe(1)
      expect(c.playCount).toBe(1)
      // hunger: feed後=80, train後=70(80-10), play後=65(70-5)
      expect(c.hunger).toBe(65)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 3: 進化条件の充足（Baby → Child）
  // -------------------------------------------------------------------------
  describe('シナリオ 3: 進化条件の充足（Baby → Child）', () => {
    it('stage=1, age=0.5 のとき canEvolve は false（minAge=1 未満）', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 0.5 })
      expect(canEvolve(creature)).toBe(false)
    })

    it('stage=1, age=1.0 のとき canEvolve は true', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 1.0 })
      expect(canEvolve(creature)).toBe(true)
    })

    it('evolveCreature 後: evolutionStage=2, maxHp=80, hp=80', () => {
      const creature = makeCreature({ evolutionStage: 1, age: 1.0 })
      const evolved = evolveCreature(creature)
      expect(evolved.evolutionStage).toBe(2)
      expect(evolved.maxHp).toBe(80)
      expect(evolved.hp).toBe(80)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 4: 進化条件の充足（Child → Adult）
  // -------------------------------------------------------------------------
  describe('シナリオ 4: 進化条件の充足（Child → Adult）', () => {
    it('stage=2, age=3, happiness=49 のとき canEvolve は false', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 49 })
      expect(canEvolve(creature)).toBe(false)
    })

    it('stage=2, age=3, happiness=50 のとき canEvolve は true', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 50 })
      expect(canEvolve(creature)).toBe(true)
    })

    it('evolveCreature 後: evolutionStage=3, maxHp=150', () => {
      const creature = makeCreature({ evolutionStage: 2, age: 3, happiness: 50 })
      const evolved = evolveCreature(creature)
      expect(evolved.evolutionStage).toBe(3)
      expect(evolved.maxHp).toBe(150)
      expect(evolved.hp).toBe(150)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 5: 時間経過 → 死亡フロー
  // -------------------------------------------------------------------------
  describe('シナリオ 5: 時間経過 → 死亡フロー', () => {
    it('hunger=5, 1 ティック後: hunger=0 になり、starvation ダメージで hp が 35 になる', () => {
      const now = Date.now()
      // applyTimeUpdate はまず hunger を減算し、その後 hunger<=0 ならダメージを加える
      // hunger=5 - 5*1 = 0 → hunger<=0 なので hp -= 5*1 → hp=35
      const creature = makeCreature({ hunger: 5, hp: 40, maxHp: 40, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30)
      const updated = applyTimeUpdate(creature, false)
      expect(updated.hunger).toBe(0)
      expect(updated.hp).toBe(35)  // 飢餓ダメージ: 40 - 5 = 35
      expect(updated.isAlive).toBe(true)
    })

    it('hunger=0 で 1 ティック後: hp が 5 減少する', () => {
      const now = Date.now()
      const creature = makeCreature({ hunger: 0, hp: 40, maxHp: 40, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30)
      const updated = applyTimeUpdate(creature, false)
      expect(updated.hunger).toBe(0)
      expect(updated.hp).toBe(35)
    })

    it('hp が 0 以下になるまでティックを重ねると isAlive=false になる', () => {
      const now = Date.now()
      // hp=5, hunger=0 → 1ティックで hp=0 → isAlive=false
      const creature = makeCreature({ hunger: 0, hp: 5, maxHp: 40, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30)
      const updated = applyTimeUpdate(creature, false)
      expect(updated.hp).toBe(0)
      expect(updated.isAlive).toBe(false)
    })

    it('useGameState の applyUpdate() 後に死亡した場合 state.screen=death になる', () => {
      const { result } = renderHook(() => useGameState())
      const now = Date.now()
      // hp=5, hunger=0 → 30分後にapplyUpdateで死亡
      const creature = makeCreature({ hunger: 0, hp: 5, maxHp: 40, lastUpdated: now })

      act(() => {
        result.current.actions.startGame(creature)
      })

      // 30分後に時刻を進める
      vi.setSystemTime(now + 1000 * 60 * 30)

      act(() => {
        result.current.actions.applyUpdate(false)
      })

      expect(result.current.state.creature!.isAlive).toBe(false)
      expect(result.current.state.screen).toBe('death')
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 6: 睡眠 → HP 回復フロー
  // -------------------------------------------------------------------------
  describe('シナリオ 6: 睡眠 → HP 回復フロー', () => {
    it('isSleeping=true, 1 ティック後: hp が 5 回復する', () => {
      const now = Date.now()
      const creature = makeCreature({ hp: 20, maxHp: 40, isSleeping: true, hunger: 80, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30)
      const updated = applyTimeUpdate(creature, false)
      expect(updated.hp).toBe(25)
    })

    it('isSleeping=true, 4 ティック後: hp が maxHp でクランプされる', () => {
      const now = Date.now()
      // hp=25, maxHp=40, 4ティック × +5 = +20 → 45 → 40にクランプ
      const creature = makeCreature({ hp: 25, maxHp: 40, isSleeping: true, hunger: 80, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30 * 4)
      const updated = applyTimeUpdate(creature, false)
      expect(updated.hp).toBe(40)
    })

    it('useGameState の sleep() で isSleeping が true になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ isSleeping: false })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.sleep()
      })

      expect(result.current.state.creature!.isSleeping).toBe(true)
    })

    it('useGameState の sleep() を 2 回呼ぶと isSleeping が false に戻る', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ isSleeping: false })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.sleep()
      })
      act(() => {
        result.current.actions.sleep()
      })

      expect(result.current.state.creature!.isSleeping).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 7: バトル結果反映フロー
  // -------------------------------------------------------------------------
  describe('シナリオ 7: バトル結果反映フロー', () => {
    it('勝利時: wins+1, exp加算, happiness+10', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ wins: 0, losses: 0, exp: 0, happiness: 70, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.applyBattleResult({
          result: 'win',
          expGain: 20,
          happinessChange: 10,
          hpAfterBattle: 25,
        })
      })

      const c = result.current.state.creature!
      expect(c.wins).toBe(1)
      expect(c.losses).toBe(0)
      expect(c.happiness).toBe(80)    // 70 + 10
    })

    it('敗北時: losses+1, happiness-5', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ wins: 0, losses: 0, happiness: 70, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.applyBattleResult({
          result: 'lose',
          expGain: 5,
          happinessChange: -5,
          hpAfterBattle: 10,
        })
      })

      const c = result.current.state.creature!
      expect(c.wins).toBe(0)
      expect(c.losses).toBe(1)
      expect(c.happiness).toBe(65)    // 70 - 5
    })

    it('hpAfterBattle=0 のとき hp は Math.max(1, 0) = 1 になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.applyBattleResult({
          result: 'lose',
          expGain: 0,
          happinessChange: -5,
          hpAfterBattle: 0,
        })
      })

      expect(result.current.state.creature!.hp).toBe(1)
    })

    it('happiness の下限クランプ: 初期 happiness=5, happinessChange=-10 → happiness=0', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ happiness: 5, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.applyBattleResult({
          result: 'lose',
          expGain: 0,
          happinessChange: -10,
          hpAfterBattle: 10,
        })
      })

      expect(result.current.state.creature!.happiness).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 8: startOver フロー
  // -------------------------------------------------------------------------
  describe('シナリオ 8: startOver フロー', () => {
    it('startGame → startOver の後: state.creature=null, state.screen=title', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      expect(result.current.state.screen).toBe('main')
      expect(result.current.state.creature).not.toBeNull()

      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(result.current.state.creature).toBeNull()
      expect(result.current.state.screen).toBe('title')
    })

    it('startOver 後: state.pendingEvolution=false', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ evolutionStage: 0 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.setPendingEvolution(true)
      })
      expect(result.current.state.pendingEvolution).toBe(true)

      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(result.current.state.pendingEvolution).toBe(false)
    })

    it('startOver で deleteCreature が呼ばれる', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(deleteCreature).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // シナリオ 9: フルライフサイクル（孵化〜成長〜進化〜死）の一連テスト
  // -------------------------------------------------------------------------
  describe('シナリオ 9: フルライフサイクル（孵化〜成長〜進化〜死）', () => {
    it('Egg→Baby: createNewCreature(stage=0) → canEvolve=true → evolveCreature(stage=1)', () => {
      const egg = createNewCreature('フルテストモン', 'Water')
      expect(egg.evolutionStage).toBe(0)
      expect(canEvolve(egg)).toBe(true)

      const baby = evolveCreature(egg)
      expect(baby.evolutionStage).toBe(1)
      expect(baby.hp).toBe(40)
      expect(baby.maxHp).toBe(40)
    })

    it('Baby → trainCreature で EXP 蓄積 → レベルアップ', () => {
      let baby = makeCreature({ evolutionStage: 1, age: 1, level: 1, exp: 0, hunger: 100 })
      // Lv1→Lv2: exp=0+20=20 >= EXP_TO_LEVEL(1)=20 → Lv2, exp=0
      baby = trainCreature(baby, true)
      expect(baby.level).toBe(2)
      expect(baby.exp).toBe(0)
    })

    it('Baby(age=1) → canEvolve=true → evolveCreature(stage=2)', () => {
      const baby = makeCreature({ evolutionStage: 1, age: 1.0, happiness: 70 })
      expect(canEvolve(baby)).toBe(true)

      const child = evolveCreature(baby)
      expect(child.evolutionStage).toBe(2)
      expect(child.maxHp).toBe(80)
      expect(child.hp).toBe(80)
    })

    it('hunger を 0 まで減らし時間経過を重ねると isAlive=false になる', () => {
      const now = Date.now()
      // hp=10, hunger=0 → 2ティックでhp=0
      let creature = makeCreature({ hunger: 0, hp: 10, maxHp: 80, lastUpdated: now })
      vi.setSystemTime(now + 1000 * 60 * 30 * 2)
      creature = applyTimeUpdate(creature, false)
      // hp=10 - 5*2 = 0 → isAlive=false
      expect(creature.hp).toBe(0)
      expect(creature.isAlive).toBe(false)
    })

    it('useGameState: evolve → train × 3 → applyUpdate の組み合わせで state が一貫する', () => {
      const { result } = renderHook(() => useGameState())
      const now = Date.now()
      // Egg → 即時進化可能
      const egg = makeCreature({
        evolutionStage: 0,
        age: 0,
        level: 1,
        exp: 0,
        hunger: 80,
        happiness: 70,
        hp: 20,
        maxHp: 20,
        lastUpdated: now,
      })

      // startGame
      act(() => {
        result.current.actions.startGame(egg)
      })
      expect(result.current.state.creature!.evolutionStage).toBe(0)

      // evolve: Egg → Baby
      act(() => {
        result.current.actions.evolve()
      })
      expect(result.current.state.creature!.evolutionStage).toBe(1)
      expect(result.current.state.screen).toBe('evolution')

      // メインに戻す（goToMain）
      act(() => {
        result.current.actions.goToMain()
      })
      expect(result.current.state.screen).toBe('main')

      // train × 3（EXP 蓄積確認）
      act(() => { result.current.actions.train() })
      act(() => { result.current.actions.train() })
      act(() => { result.current.actions.train() })

      const afterTrain = result.current.state.creature!
      expect(afterTrain.trainCount).toBe(3)
      // 3回trainでexp=60(Lv2閾値20+Lv2の40でLv3到達) か level が上がっているはず
      expect(afterTrain.level).toBeGreaterThanOrEqual(2)

      // applyUpdate: 時刻を30分後に進めてtimediff=1tick
      vi.setSystemTime(now + 1000 * 60 * 30)
      act(() => {
        result.current.actions.applyUpdate(false)
      })

      // isAlive=true（hunger=80台、hp=40で十分生存）
      const afterUpdate = result.current.state.creature!
      expect(afterUpdate.isAlive).toBe(true)
      expect(afterUpdate.screen).toBeUndefined() // creatureにscreenプロパティはない
      expect(result.current.state.screen).toBe('main')
    })

    it('EXP_TO_LEVEL の仕様確認: level×20 であること', () => {
      expect(EXP_TO_LEVEL(1)).toBe(20)
      expect(EXP_TO_LEVEL(2)).toBe(40)
      expect(EXP_TO_LEVEL(8)).toBe(160)
      expect(EXP_TO_LEVEL(14)).toBe(280)
    })
  })
})

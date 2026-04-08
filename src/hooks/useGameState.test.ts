// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Creature } from '../types/creature'
import type { BattleResult } from '../types/battle'
import { useGameState } from './useGameState'

// storage モジュールをモック（IndexedDB を使わないようにする）
vi.mock('../utils/storage', () => ({
  saveCreature: vi.fn().mockResolvedValue(undefined),
  deleteCreature: vi.fn().mockResolvedValue(undefined),
  loadCreature: vi.fn().mockResolvedValue(null),
  exportSave: vi.fn().mockResolvedValue(undefined),
  importSave: vi.fn().mockResolvedValue(null),
}))

import { saveCreature, deleteCreature } from '../utils/storage'

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
    name: 'テストモン',
    type: 'Fire',
    evolutionStage: 1,
    level: 5,
    exp: 0,
    hp: 40,
    maxHp: 40,
    atk: 10,
    def: 8,
    spd: 8,
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

describe('useGameState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初期状態', () => {
    it('初期状態は creature=null, screen=title, devMode=false, pendingEvolution=false, attackAnimation=false, evolvedFrom=null, message=null である', () => {
      const { result } = renderHook(() => useGameState())
      expect(result.current.state.creature).toBeNull()
      expect(result.current.state.screen).toBe('title')
      expect(result.current.state.devMode).toBe(false)
      expect(result.current.state.pendingEvolution).toBe(false)
      expect(result.current.state.attackAnimation).toBe(false)
      expect(result.current.state.evolvedFrom).toBeNull()
      expect(result.current.state.message).toBeNull()
    })
  })

  describe('startGame', () => {
    it('creature がセットされ、screen が main になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })

      expect(result.current.state.creature).toEqual(creature)
      expect(result.current.state.screen).toBe('main')
    })

    it('saveCreature が呼ばれる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })

      expect(saveCreature).toHaveBeenCalledWith(creature)
    })
  })

  describe('loadGame', () => {
    it('creature がセットされ、screen が main になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.loadGame(creature)
      })

      expect(result.current.state.creature).toEqual(creature)
      expect(result.current.state.screen).toBe('main')
    })

    it('saveCreature は呼ばれない', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.loadGame(creature)
      })

      expect(saveCreature).not.toHaveBeenCalled()
    })
  })

  describe('feed', () => {
    it('creature の hunger が増加する', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ hunger: 50 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.feed()
      })

      expect(result.current.state.creature!.hunger).toBeGreaterThan(50)
    })

    it('feedCount が増加する', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ feedCount: 0 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      vi.clearAllMocks()
      act(() => {
        result.current.actions.feed()
      })

      expect(result.current.state.creature!.feedCount).toBe(1)
    })

    it('saveCreature が呼ばれる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      vi.clearAllMocks()
      act(() => {
        result.current.actions.feed()
      })

      expect(saveCreature).toHaveBeenCalled()
    })

    it('message がセットされる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.feed()
      })

      expect(result.current.state.message).not.toBeNull()
      expect(typeof result.current.state.message).toBe('string')
    })
  })

  describe('train', () => {
    it('creature の trainCount が増加する', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ trainCount: 0 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.train()
      })

      expect(result.current.state.creature!.trainCount).toBe(1)
    })

    it('attackAnimation が true になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.train()
      })

      expect(result.current.state.attackAnimation).toBe(true)
    })

    it('1000ms 後に attackAnimation が false になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.train()
      })
      expect(result.current.state.attackAnimation).toBe(true)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.state.attackAnimation).toBe(false)
    })
  })

  describe('play', () => {
    it('creature の playCount が増加する', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ playCount: 0 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.play()
      })

      expect(result.current.state.creature!.playCount).toBe(1)
    })

    it('saveCreature が呼ばれる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      vi.clearAllMocks()
      act(() => {
        result.current.actions.play()
      })

      expect(saveCreature).toHaveBeenCalled()
    })
  })

  describe('sleep', () => {
    it('isSleeping が false から true にトグルされる', () => {
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

    it('isSleeping が true から false にトグルされる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ isSleeping: true })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.sleep()
      })

      expect(result.current.state.creature!.isSleeping).toBe(false)
    })
  })

  describe('evolve', () => {
    it('evolutionStage が +1 される', () => {
      const { result } = renderHook(() => useGameState())
      // stage=1 で進化条件を満たす状態を作る（age, happiness, level を余裕持って設定）
      const creature = makeCreature({
        evolutionStage: 1,
        age: 5,
        happiness: 80,
        level: 10,
        atk: 30,
        def: 30,
        spd: 30,
      })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.evolve()
      })

      expect(result.current.state.creature!.evolutionStage).toBe(2)
    })

    it('screen が evolution になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ evolutionStage: 1, age: 5, happiness: 80, level: 10 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.evolve()
      })

      expect(result.current.state.screen).toBe('evolution')
    })

    it('pendingEvolution が false になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ evolutionStage: 1, age: 5, happiness: 80, level: 10 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.setPendingEvolution(true)
      })
      act(() => {
        result.current.actions.evolve()
      })

      expect(result.current.state.pendingEvolution).toBe(false)
    })

    it('evolvedFrom に進化前の stage がセットされる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ evolutionStage: 1, age: 5, happiness: 80, level: 10 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.evolve()
      })

      expect(result.current.state.evolvedFrom).toBe(1)
    })
  })

  describe('startOver', () => {
    it('creature が null になる', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(result.current.state.creature).toBeNull()
    })

    it('screen が title になる', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(result.current.state.screen).toBe('title')
    })

    it('deleteCreature が呼ばれる', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(deleteCreature).toHaveBeenCalled()
    })

    it('pendingEvolution が false、evolvedFrom が null にリセットされる', async () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ evolutionStage: 1, age: 5, happiness: 80, level: 10 })

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.setPendingEvolution(true)
      })
      act(() => {
        result.current.actions.evolve()
      })
      await act(async () => {
        await result.current.actions.startOver()
      })

      expect(result.current.state.pendingEvolution).toBe(false)
      expect(result.current.state.evolvedFrom).toBeNull()
    })
  })

  describe('toggleDevMode', () => {
    it('devMode が false から true にトグルされる', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.actions.toggleDevMode()
      })

      expect(result.current.state.devMode).toBe(true)
    })

    it('devMode が true から false にトグルされる', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.actions.toggleDevMode()
      })
      act(() => {
        result.current.actions.toggleDevMode()
      })

      expect(result.current.state.devMode).toBe(false)
    })
  })

  describe('setPendingEvolution', () => {
    it('pendingEvolution が true に更新される', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.actions.setPendingEvolution(true)
      })

      expect(result.current.state.pendingEvolution).toBe(true)
    })

    it('pendingEvolution が false に更新される', () => {
      const { result } = renderHook(() => useGameState())

      act(() => {
        result.current.actions.setPendingEvolution(true)
      })
      act(() => {
        result.current.actions.setPendingEvolution(false)
      })

      expect(result.current.state.pendingEvolution).toBe(false)
    })
  })

  describe('applyBattleResult', () => {
    it('win のとき wins が +1 される', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ wins: 2, losses: 1, exp: 0, happiness: 70, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'win',
        expGain: 20,
        happinessChange: 10,
        hpAfterBattle: 25,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.wins).toBe(3)
      expect(result.current.state.creature!.losses).toBe(1)
    })

    it('win のとき exp が加算される', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ exp: 10, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'win',
        expGain: 20,
        happinessChange: 5,
        hpAfterBattle: 25,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      // exp は加算されている（レベルアップがなければ 30 になる）
      expect(result.current.state.creature!.exp).toBeGreaterThanOrEqual(10 + 20)
    })

    it('lose のとき losses が +1 される', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ wins: 1, losses: 0, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'lose',
        expGain: 5,
        happinessChange: -10,
        hpAfterBattle: 5,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.losses).toBe(1)
      expect(result.current.state.creature!.wins).toBe(1)
    })

    it('hp は最低でも 1 になる（0 以下にならない）', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'lose',
        expGain: 0,
        happinessChange: -10,
        hpAfterBattle: 0,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.hp).toBe(1)
    })

    it('hp が負の値でも最低 1 になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'lose',
        expGain: 0,
        happinessChange: -20,
        hpAfterBattle: -10,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.hp).toBe(1)
    })

    it('happiness は 100 を超えない（上限クランプ）', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ happiness: 95, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'win',
        expGain: 10,
        happinessChange: 20,
        hpAfterBattle: 25,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.happiness).toBe(100)
    })

    it('happiness は 0 を下回らない（下限クランプ）', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature({ happiness: 5, hp: 30 })

      act(() => {
        result.current.actions.startGame(creature)
      })

      const battleResult: BattleResult = {
        result: 'lose',
        expGain: 0,
        happinessChange: -20,
        hpAfterBattle: 10,
      }
      act(() => {
        result.current.actions.applyBattleResult(battleResult)
      })

      expect(result.current.state.creature!.happiness).toBe(0)
    })
  })

  describe('showMessage（タイマー経由）', () => {
    it('feed 後に message がセットされ、2500ms 後に null になる', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.feed()
      })

      expect(result.current.state.message).not.toBeNull()

      act(() => {
        vi.advanceTimersByTime(2500)
      })

      expect(result.current.state.message).toBeNull()
    })

    it('2499ms では message がまだ残っている', () => {
      const { result } = renderHook(() => useGameState())
      const creature = makeCreature()

      act(() => {
        result.current.actions.startGame(creature)
      })
      act(() => {
        result.current.actions.feed()
      })

      act(() => {
        vi.advanceTimersByTime(2499)
      })

      expect(result.current.state.message).not.toBeNull()
    })
  })
})

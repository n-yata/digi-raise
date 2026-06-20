// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Creature } from '../types/creature'

// storage モジュールをモック
vi.mock('../utils/storage', () => ({
  saveSaveData: vi.fn().mockResolvedValue(undefined),
}))

// gameLogic の applyTimeUpdate をモック（返す値を制御しやすくする）
vi.mock('../utils/gameLogic', () => ({
  applyTimeUpdate: vi.fn(),
  createNewCreature: vi.fn(),
  feedCreature: vi.fn(),
  trainCreature: vi.fn(),
  playWithCreature: vi.fn(),
  toggleLights: vi.fn(),
  isNightTime: vi.fn(),
  isLightsOn: vi.fn(),
  getAnimationState: vi.fn(),
}))

// evolution の canEvolve をモック
vi.mock('../utils/evolution', () => ({
  canEvolve: vi.fn(),
  evolveCreature: vi.fn(),
  getEvolutionProgress: vi.fn(),
}))

import { useTimeUpdate } from './useTimeUpdate'
import { applyTimeUpdate } from '../utils/gameLogic'
import { canEvolve } from '../utils/evolution'
import { saveSaveData } from '../utils/storage'

const mockApplyTimeUpdate = vi.mocked(applyTimeUpdate)
const mockCanEvolve = vi.mocked(canEvolve)

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

describe('useTimeUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // デフォルトのモック動作: isAlive=true の creature を返す
    mockApplyTimeUpdate.mockImplementation((creature) => ({ ...creature }))
    mockCanEvolve.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('creature=null の場合', () => {
    it('tick が発火しても onUpdate が呼ばれない', () => {
      const onUpdate = vi.fn()
      const onDeath = vi.fn()
      const onEvolutionReady = vi.fn()

      renderHook(() =>
        useTimeUpdate({
          creature: null,
          devMode: false,
          onUpdate,
          onDeath,
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(onUpdate).not.toHaveBeenCalled()
      expect(onDeath).not.toHaveBeenCalled()
      expect(onEvolutionReady).not.toHaveBeenCalled()
    })
  })

  describe('creature.isAlive=false の場合', () => {
    it('tick が発火しても onUpdate が呼ばれない', () => {
      const onUpdate = vi.fn()
      const onDeath = vi.fn()
      const onEvolutionReady = vi.fn()
      const deadCreature = makeCreature({ isAlive: false })

      renderHook(() =>
        useTimeUpdate({
          creature: deadCreature,
          devMode: false,
          onUpdate,
          onDeath,
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(onUpdate).not.toHaveBeenCalled()
      expect(onDeath).not.toHaveBeenCalled()
    })
  })

  describe('通常モード（devMode=false）', () => {
    it('30000ms 経過で onUpdate が呼ばれる', () => {
      const onUpdate = vi.fn()
      const onDeath = vi.fn()
      const onEvolutionReady = vi.fn()
      const creature = makeCreature()

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate,
          onDeath,
          onEvolutionReady,
        })
      )

      // 30000ms 未満では呼ばれない
      act(() => {
        vi.advanceTimersByTime(29999)
      })
      expect(onUpdate).not.toHaveBeenCalled()

      // 30000ms 経過で呼ばれる
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    it('30000ms 経過で saveCreature が呼ばれる', () => {
      const creature = makeCreature()

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate: vi.fn(),
          onDeath: vi.fn(),
          onEvolutionReady: vi.fn(),
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(saveSaveData).toHaveBeenCalledTimes(1)
    })
  })

  describe('devMode=true の場合', () => {
    it('5000ms 経過で onUpdate が呼ばれる', () => {
      const onUpdate = vi.fn()
      const creature = makeCreature()

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: true,
          onUpdate,
          onDeath: vi.fn(),
          onEvolutionReady: vi.fn(),
        })
      )

      // 5000ms 未満では呼ばれない
      act(() => {
        vi.advanceTimersByTime(4999)
      })
      expect(onUpdate).not.toHaveBeenCalled()

      // 5000ms 経過で呼ばれる
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    it('通常モードの 30000ms では呼ばれない（5000ms インターバルで動作している）', () => {
      const onUpdate = vi.fn()
      const creature = makeCreature()

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: true,
          onUpdate,
          onDeath: vi.fn(),
          onEvolutionReady: vi.fn(),
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      // 30000ms / 5000ms = 6回呼ばれるはず（devMode なので）
      expect(onUpdate).toHaveBeenCalledTimes(6)
    })
  })

  describe('isAlive=false が返ってきた場合', () => {
    it('onDeath が呼ばれる', () => {
      const onUpdate = vi.fn()
      const onDeath = vi.fn()
      const onEvolutionReady = vi.fn()
      const creature = makeCreature({ isAlive: true })

      // tick 時に isAlive=false を返す
      mockApplyTimeUpdate.mockReturnValue({ ...creature, isAlive: false, hp: 0 })

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate,
          onDeath,
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(onDeath).toHaveBeenCalledTimes(1)
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    it('onDeath 後、onEvolutionReady は呼ばれない', () => {
      const onUpdate = vi.fn()
      const onDeath = vi.fn()
      const onEvolutionReady = vi.fn()
      const creature = makeCreature({ isAlive: true })

      mockApplyTimeUpdate.mockReturnValue({ ...creature, isAlive: false, hp: 0 })
      mockCanEvolve.mockReturnValue(true)

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate,
          onDeath,
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      // death 時は早期 return するので onEvolutionReady は呼ばれない
      expect(onEvolutionReady).not.toHaveBeenCalled()
    })
  })

  describe('canEvolve の挙動', () => {
    it('canEvolve=true かつ前回 false のとき onEvolutionReady が呼ばれる', () => {
      const onEvolutionReady = vi.fn()
      const creature = makeCreature()

      // 最初の tick で canEvolve=true を返す
      mockApplyTimeUpdate.mockReturnValue({ ...creature })
      mockCanEvolve.mockReturnValue(true)

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate: vi.fn(),
          onDeath: vi.fn(),
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(onEvolutionReady).toHaveBeenCalledTimes(1)
    })

    it('canEvolve が連続して true のとき onEvolutionReady は 2 回目以降呼ばれない', () => {
      const onEvolutionReady = vi.fn()
      const creature = makeCreature()

      mockApplyTimeUpdate.mockReturnValue({ ...creature })
      // 毎回 canEvolve=true を返し続ける
      mockCanEvolve.mockReturnValue(true)

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate: vi.fn(),
          onDeath: vi.fn(),
          onEvolutionReady,
        })
      )

      // 3 回 tick を発火
      act(() => {
        vi.advanceTimersByTime(90000)
      })

      // 最初の tick のみ（前回 false → 今回 true）で onEvolutionReady が呼ばれる
      expect(onEvolutionReady).toHaveBeenCalledTimes(1)
    })

    it('canEvolve=false のときは onEvolutionReady が呼ばれない', () => {
      const onEvolutionReady = vi.fn()
      const creature = makeCreature()

      mockApplyTimeUpdate.mockReturnValue({ ...creature })
      mockCanEvolve.mockReturnValue(false)

      renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate: vi.fn(),
          onDeath: vi.fn(),
          onEvolutionReady,
        })
      )

      act(() => {
        vi.advanceTimersByTime(60000)
      })

      expect(onEvolutionReady).not.toHaveBeenCalled()
    })
  })

  describe('アンマウント時', () => {
    it('アンマウント後はタイマーが停止し tick が発火しない', () => {
      const onUpdate = vi.fn()
      const creature = makeCreature()

      const { unmount } = renderHook(() =>
        useTimeUpdate({
          creature,
          devMode: false,
          onUpdate,
          onDeath: vi.fn(),
          onEvolutionReady: vi.fn(),
        })
      )

      // アンマウント前に 1 回 tick
      act(() => {
        vi.advanceTimersByTime(30000)
      })
      expect(onUpdate).toHaveBeenCalledTimes(1)

      // アンマウント
      unmount()

      // アンマウント後にタイマーを進めても呼ばれない
      act(() => {
        vi.advanceTimersByTime(60000)
      })
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })
  })
})

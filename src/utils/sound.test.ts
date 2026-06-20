// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  playSound,
  initSound,
  isMuted,
  setMuted,
  toggleMuted,
  subscribeMuted,
} from './sound'

const MUTE_KEY = 'digi-raise:muted'

describe('sound: ミュート状態の管理', () => {
  beforeEach(() => {
    localStorage.clear()
    // モジュール状態を既知の値（音あり）へ戻す
    setMuted(false)
  })

  it('既定では音あり（ミュートでない）', () => {
    expect(isMuted()).toBe(false)
  })

  it('setMuted(true) でミュートになり localStorage に永続化される', () => {
    setMuted(true)
    expect(isMuted()).toBe(true)
    expect(localStorage.getItem(MUTE_KEY)).toBe('1')
  })

  it('setMuted(false) で解除され localStorage に 0 が保存される', () => {
    setMuted(true)
    setMuted(false)
    expect(isMuted()).toBe(false)
    expect(localStorage.getItem(MUTE_KEY)).toBe('0')
  })

  it('toggleMuted は状態を反転し、反転後の値を返す', () => {
    expect(isMuted()).toBe(false)
    expect(toggleMuted()).toBe(true)
    expect(isMuted()).toBe(true)
    expect(toggleMuted()).toBe(false)
    expect(isMuted()).toBe(false)
  })

  it('subscribeMuted は変更を購読し、解除できる', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeMuted(listener)

    setMuted(true)
    expect(listener).toHaveBeenCalledWith(true)

    setMuted(false)
    expect(listener).toHaveBeenCalledWith(false)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    setMuted(true)
    // 解除後は通知されない
    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('sound: 安全性（AudioContext 非対応環境）', () => {
  beforeEach(() => {
    localStorage.clear()
    setMuted(false)
  })

  it('jsdom には AudioContext が無いため playSound は例外を投げず no-op で通る', () => {
    // jsdom 環境では window.AudioContext は未定義
    expect(() => playSound('feed')).not.toThrow()
    expect(() => playSound('win')).not.toThrow()
  })

  it('ミュート中は playSound が何もしない（例外も投げない）', () => {
    setMuted(true)
    expect(() => playSound('evolve')).not.toThrow()
  })

  it('initSound はジェスチャリスナを登録し、例外を投げない', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    expect(() => initSound()).not.toThrow()
    addSpy.mockRestore()
  })
})

describe('sound: AudioContext が利用可能な場合の再生', () => {
  let oscillators: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }>

  beforeEach(() => {
    localStorage.clear()
    setMuted(false)
    oscillators = []

    // 最小限の AudioContext モックを注入する
    class MockAudioContext {
      state = 'running'
      currentTime = 0
      destination = {}
      createOscillator() {
        const osc = {
          type: 'square',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }
        oscillators.push(osc)
        return osc
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }
      }
      resume() {
        return Promise.resolve()
      }
    }
    ;(window as unknown as { AudioContext: unknown }).AudioContext =
      MockAudioContext as unknown as typeof AudioContext
  })

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
  })

  it('feed は複数のオシレータ（音）を生成して再生する', () => {
    playSound('feed')
    // feed は 2 音のレシピ
    expect(oscillators.length).toBe(2)
    for (const osc of oscillators) {
      expect(osc.start).toHaveBeenCalled()
      expect(osc.stop).toHaveBeenCalled()
    }
  })
})

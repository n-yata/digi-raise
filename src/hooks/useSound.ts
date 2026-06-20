import { useEffect, useState, useCallback } from 'react'
import { isMuted, setMuted as setMutedEngine, subscribeMuted } from '../utils/sound'

/**
 * 効果音のミュート状態を React から扱うためのフック。
 * サウンドエンジン（src/utils/sound.ts）の状態を購読し、トグル手段を提供する。
 */
export function useSound() {
  const [muted, setMutedState] = useState<boolean>(isMuted)

  useEffect(() => subscribeMuted(setMutedState), [])

  const setMuted = useCallback((value: boolean) => setMutedEngine(value), [])
  const toggleMuted = useCallback(() => setMutedEngine(!isMuted()), [])

  return { muted, setMuted, toggleMuted }
}

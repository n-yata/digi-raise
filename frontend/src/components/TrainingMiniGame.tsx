import { useState, useEffect, useRef, useCallback } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

interface Props {
  creature: Creature
  onResult: (success: boolean) => void
}

const ZONE_START = 35
const ZONE_END = 65
const SPEED = 1.5 // % per frame (~60fps)

export default function TrainingMiniGame({ creature, onResult }: Props) {
  const [markerPos, setMarkerPos] = useState(0)
  const [result, setResult] = useState<'success' | 'fail' | null>(null)
  const [stopped, setStopped] = useState(false)
  const posRef = useRef(0)
  const dirRef = useRef(1)
  const stoppedRef = useRef(false)
  const color = TYPE_COLORS[creature.type]

  useEffect(() => {
    const frame = setInterval(() => {
      if (stoppedRef.current) return
      posRef.current += dirRef.current * SPEED
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1 }
      else if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1 }
      setMarkerPos(posRef.current)
    }, 16)
    return () => clearInterval(frame)
  }, [])

  const handleTap = useCallback(() => {
    if (stoppedRef.current) return
    stoppedRef.current = true
    setStopped(true)
    const pos = posRef.current
    const success = pos >= ZONE_START && pos <= ZONE_END
    setResult(success ? 'success' : 'fail')
    setTimeout(() => onResult(success), 1500)
  }, [onResult])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="p-6 rounded-2xl mx-4 w-full max-w-sm"
        style={{ background: '#16213e', border: `2px solid ${color}` }}
      >
        <div className="text-center mb-2 font-pixel" style={{ fontSize: '0.7rem', color }}>
          ⚔️ トレーニング！
        </div>
        <div className="text-center mb-5 font-pixel" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>
          {result ? '\u00a0' : '緑ゾーンでタップ！'}
        </div>

        {/* Bar */}
        <div
          className="relative w-full rounded-full overflow-hidden mb-6"
          style={{ height: 36, background: '#0f172a', border: '1px solid #334155' }}
        >
          {/* Success zone */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${ZONE_START}%`,
              width: `${ZONE_END - ZONE_START}%`,
              background: 'rgba(74,222,128,0.25)',
              borderLeft: '2px solid rgba(74,222,128,0.8)',
              borderRight: '2px solid rgba(74,222,128,0.8)',
            }}
          />
          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded"
            style={{
              width: 12,
              height: 24,
              left: `calc(${markerPos}% - 6px)`,
              background: stopped
                ? result === 'success' ? '#4ade80' : '#f87171'
                : color,
              boxShadow: stopped ? 'none' : `0 0 10px ${color}`,
            }}
          />
        </div>

        {/* Result */}
        {result && (
          <div
            className="text-center mb-5 font-pixel"
            style={{
              fontSize: '0.9rem',
              color: result === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            {result === 'success' ? '🎯 成功！' : '💥 失敗…'}
          </div>
        )}

        {/* Tap button */}
        {!stopped && (
          <button
            onClick={handleTap}
            className="w-full py-4 rounded-xl font-pixel active:scale-95 transition-transform"
            style={{
              fontSize: '0.8rem',
              background: `linear-gradient(135deg, ${color}44, ${color}22)`,
              border: `2px solid ${color}`,
              color,
              letterSpacing: '0.1em',
            }}
          >
            タップ！
          </button>
        )}
      </div>
    </div>
  )
}

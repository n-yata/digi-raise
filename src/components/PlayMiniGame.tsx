import { useState, useCallback } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'
import CreatureSprite from './CreatureSprite'

interface Props {
  creature: Creature
  onResult: () => void
}

const TOTAL_TAPS = 3

export default function PlayMiniGame({ creature, onResult }: Props) {
  const [taps, setTaps] = useState(0)
  const [bounce, setBounce] = useState(false)
  const [done, setDone] = useState(false)

  const color = TYPE_COLORS[creature.type]

  const handleTap = useCallback(() => {
    if (done) return

    setBounce(true)
    setTimeout(() => setBounce(false), 300)

    const next = taps + 1
    setTaps(next)

    if (next >= TOTAL_TAPS) {
      setDone(true)
      setTimeout(() => onResult(), 1500)
    }
  }, [taps, done, onResult])

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
          🎮 あそぶ！
        </div>
        <div className="text-center mb-5 font-pixel" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>
          {done ? '\u00a0' : 'タップして遊ぼう！'}
        </div>

        {/* Creature sprite */}
        <div
          className="flex justify-center mb-6 select-none"
          style={{
            transform: bounce ? 'scale(1.2) translateY(-10px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.15s ease-out',
          }}
          onClick={!done ? handleTap : undefined}
        >
          <CreatureSprite
            type={creature.type}
            stage={creature.evolutionStage}
            animState={done ? 'happy' : 'idle'}
          />
        </div>

        {/* Result */}
        {done && (
          <div
            className="text-center mb-5 font-pixel"
            style={{ fontSize: '0.9rem', color: '#4ade80' }}
          >
            楽しかった！🎉
          </div>
        )}

      </div>
    </div>
  )
}

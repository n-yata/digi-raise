import { useEffect, useState } from 'react'
import type { Creature, EvolutionStage } from '../types/creature'
import { TYPE_COLORS, TYPE_EMOJIS, STAGE_NAMES } from '../data/evolutions'
import CreatureSprite from './CreatureSprite'

interface EvolutionScreenProps {
  creature: Creature
  evolvedFrom: EvolutionStage | null
  onContinue: () => void
}

export default function EvolutionScreen({ creature, evolvedFrom, onContinue }: EvolutionScreenProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'done'>('flash')
  const color = TYPE_COLORS[creature.type]

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1500)
    const t2 = setTimeout(() => setPhase('done'), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const prevStage = (evolvedFrom ?? (creature.evolutionStage - 1)) as EvolutionStage
  const prevName = STAGE_NAMES[prevStage]
  const newName = creature.evolutionName

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: phase === 'flash'
          ? 'white'
          : `radial-gradient(ellipse at center, ${color}33 0%, #0a0a1a 100%)`,
        transition: 'background 0.8s ease',
      }}
    >
      {phase === 'flash' && (
        <div className="flex flex-col items-center">
          <div className="text-8xl animate-evolve-glow">✨</div>
          <div className="font-pixel text-2xl mt-4 animate-pulse" style={{ color: '#ffd700' }}>
            進化中！！
          </div>
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div className="flex flex-col items-center bounce-in">
          {/* Stars */}
          <div className="relative mb-4">
            <div className="text-4xl absolute -top-4 -left-8 animate-float" style={{ animationDelay: '0s' }}>⭐</div>
            <div className="text-4xl absolute -top-4 -right-8 animate-float" style={{ animationDelay: '0.3s' }}>⭐</div>
            <div className="text-4xl absolute -top-8 animate-float" style={{ animationDelay: '0.15s' }}>🌟</div>
          </div>

          <div className="font-pixel mb-2" style={{ fontSize: '0.6rem', color: '#64748b' }}>
            {TYPE_EMOJIS[creature.type]} {prevName} から...
          </div>

          <div
            className="font-pixel text-center mb-6 animate-pulse"
            style={{ fontSize: '1.2rem', color: '#ffd700', textShadow: `0 0 20px ${color}` }}
          >
            {newName}
            <br />
            <span style={{ fontSize: '0.7rem', color }}>に進化した！</span>
          </div>

          {/* New creature display */}
          <div
            className="relative p-8 rounded-2xl mb-6"
            style={{
              background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
              border: `2px solid ${color}66`,
              boxShadow: `0 0 40px ${color}44`,
            }}
          >
            <CreatureSprite
              type={creature.type}
              stage={creature.evolutionStage}
              animState="happy"
              customSvg={creature.customSprites?.[creature.evolutionStage]}
            />
            {/* Sparkles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute sparkle"
                style={{
                  fontSize: 16,
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
                  animationDelay: `${i * 0.25}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>

          {/* New stats */}
          <div
            className="grid grid-cols-3 gap-3 mb-6 px-4 py-3 rounded-lg"
            style={{ background: '#16213e', border: `1px solid ${color}44` }}
          >
            {[
              { label: 'HP', value: creature.maxHp },
              { label: 'ATK', value: creature.atk },
              { label: 'DEF', value: creature.def },
              { label: 'SPD', value: creature.spd },
              { label: 'LV', value: creature.level },
              { label: 'ステージ', value: STAGE_NAMES[creature.evolutionStage] },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</div>
                <div className="font-pixel" style={{ fontSize: '0.7rem', color }}>{value}</div>
              </div>
            ))}
          </div>

          {phase === 'done' && (
            <button
              onClick={onContinue}
              className="px-8 py-4 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-125 bounce-in"
              style={{
                fontSize: '0.65rem',
                background: `linear-gradient(135deg, ${color}44, ${color}22)`,
                border: `2px solid ${color}`,
                color: '#ffd700',
                boxShadow: `0 0 20px ${color}66`,
              }}
            >
              つづける！
            </button>
          )}
        </div>
      )}
    </div>
  )
}

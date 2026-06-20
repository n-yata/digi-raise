import { useEffect, useState } from 'react'
import type { Creature, EvolutionStage } from '../types/creature'
import { BRANCH_COLORS, STAGE_NAMES, getCreatureBranch } from '../data/evolutions'
import CreatureSprite from './CreatureSprite'

interface EvolutionScreenProps {
  creature: Creature
  evolvedFrom: EvolutionStage | null
  onContinue: () => void
}

export default function EvolutionScreen({ creature, evolvedFrom, onContinue }: EvolutionScreenProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'done'>('flash')
  const color = BRANCH_COLORS[getCreatureBranch(creature.creatureId)]

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
          <div
            className="animate-evolve-glow"
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffffff 0%, #ffd700 50%, transparent 75%)',
              boxShadow: '0 0 40px #ffd700',
            }}
          />
          <div className="font-pixel text-2xl mt-4 animate-retro-blink" style={{ color: '#ffd700' }}>
            進化中！！
          </div>
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div className="flex flex-col items-center bounce-in">
          <div className="font-pixel mb-2 flex items-center gap-2" style={{ fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: '0.85rem', height: '0.85rem', borderRadius: '50%', background: color }} />
            {prevName} から...
          </div>

          <div
            className="font-pixel text-center mb-6 animate-retro-blink"
            style={{ fontSize: '1.2rem', color: '#ffd700', textShadow: `0 0 20px ${color}` }}
          >
            {newName}
            <br />
            <span style={{ fontSize: '1rem', color }}>に進化した！</span>
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
              creatureId={creature.creatureId}
              stage={creature.evolutionStage}
              animState="happy"
            />
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
                <div className="font-pixel" style={{ fontSize: '0.9rem', color: '#64748b' }}>{label}</div>
                <div className="font-pixel" style={{ fontSize: '1rem', color }}>{value}</div>
              </div>
            ))}
          </div>

          {phase === 'done' && (
            <button
              onClick={onContinue}
              className="px-8 py-4 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-125 bounce-in"
              style={{
                fontSize: '0.9rem',
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

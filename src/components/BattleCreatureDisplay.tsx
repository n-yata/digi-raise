import { useEffect, useState } from 'react'
import CreatureSprite from './CreatureSprite'
import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

export type BattleEffectType = 'hit' | 'guard' | 'special' | 'heal' | 'poison' | 'paralysis' | null

interface BattleCreatureDisplayProps {
  name: string
  type: string
  evolutionStage: number
  isOpponent: boolean
  effect: BattleEffectType
  damageNumber: number | null
  poisonActive: boolean
  paralyzed: boolean
  customSvg?: string
}

export default function BattleCreatureDisplay({
  name,
  type,
  evolutionStage,
  isOpponent,
  effect,
  damageNumber,
  poisonActive,
  paralyzed,
  customSvg,
}: BattleCreatureDisplayProps) {
  const [showEffect, setShowEffect] = useState<BattleEffectType>(null)
  const [showDamage, setShowDamage] = useState<number | null>(null)
  const [effectKey, setEffectKey] = useState(0)

  const color = TYPE_COLORS[type as CreatureType] || '#888'

  useEffect(() => {
    if (effect) {
      setShowEffect(effect)
      setEffectKey(k => k + 1)
      const timer = setTimeout(() => setShowEffect(null), 800)
      return () => clearTimeout(timer)
    }
  }, [effect])

  useEffect(() => {
    if (damageNumber !== null) {
      setShowDamage(damageNumber)
      setEffectKey(k => k + 1)
      const timer = setTimeout(() => setShowDamage(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [damageNumber])

  const isHit = showEffect === 'hit' || showEffect === 'poison'
  const isGuard = showEffect === 'guard'
  const isSpecial = showEffect === 'special'
  const isHeal = showEffect === 'heal'

  const animState = isHit ? 'attack' as const : 'idle' as const

  return (
    <div
      className={`relative flex flex-col items-center ${isOpponent ? 'slide-in-right' : 'slide-in-left'}`}
      style={{ minHeight: 120 }}
    >
      {/* Name label */}
      <div
        className="font-pixel mb-1"
        style={{
          fontSize: '0.65rem',
          color: isOpponent ? '#f87171' : '#4ade80',
          textShadow: `0 0 6px ${isOpponent ? '#f8717166' : '#4ade8066'}`,
        }}
      >
        {isOpponent ? '🎯 ' : ''}{name}{!isOpponent ? '（あなた）' : ''}
      </div>

      {/* Creature sprite container */}
      <div
        className={`relative ${isHit ? 'battle-hit-shake battle-hit-flash' : ''} ${isSpecial ? 'special-charge' : ''}`}
        key={isHit || isSpecial ? effectKey : 'stable'}
        style={{
          color: color,
          transform: isOpponent ? undefined : 'scaleX(-1)',
        }}
      >
        <CreatureSprite
          type={type as CreatureType}
          stage={evolutionStage as EvolutionStage}
          animState={animState}
          customSvg={isOpponent ? undefined : customSvg}
        />

        {/* Poison overlay */}
        {poisonActive && (
          <div
            className="absolute inset-0 rounded-full poison-overlay"
            style={{
              background: 'radial-gradient(circle, #4ade8033 0%, transparent 70%)',
              border: '2px solid #4ade8044',
            }}
          />
        )}

        {/* Paralysis sparks */}
        {paralyzed && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute paralysis-spark" style={{ top: '10%', left: '15%', fontSize: 14 }}>⚡</span>
            <span className="absolute paralysis-spark" style={{ top: '40%', right: '10%', fontSize: 12, animationDelay: '0.3s' }}>⚡</span>
          </div>
        )}

        {/* Guard shield */}
        {isGuard && (
          <div
            key={`guard-${effectKey}`}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="guard-pulse rounded-full"
              style={{
                width: 80,
                height: 80,
                border: '3px solid #60a5fa',
                background: 'radial-gradient(circle, #60a5fa22 0%, transparent 70%)',
              }}
            />
            <span className="absolute text-3xl" style={{ filter: 'drop-shadow(0 0 8px #60a5fa)' }}>🛡️</span>
          </div>
        )}

        {/* Special attack burst */}
        {isSpecial && (
          <div
            key={`special-${effectKey}`}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="star-burst"
              style={{
                width: 40,
                height: 40,
                background: `radial-gradient(circle, ${color}88, transparent)`,
                borderRadius: '50%',
              }}
            />
          </div>
        )}

        {/* Hit impact burst */}
        {isHit && showEffect === 'hit' && (
          <div
            key={`hit-${effectKey}`}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="absolute text-2xl star-burst" style={{ filter: `drop-shadow(0 0 6px #f43f5e)` }}>💥</span>
          </div>
        )}

        {/* Heal effect */}
        {isHeal && (
          <div
            key={`heal-${effectKey}`}
            className="absolute inset-0 pointer-events-none"
          >
            <span className="absolute sparkle" style={{ top: '20%', left: '20%', fontSize: 16 }}>💚</span>
            <span className="absolute sparkle" style={{ top: '10%', right: '20%', fontSize: 14, animationDelay: '0.2s' }}>✨</span>
            <span className="absolute sparkle" style={{ top: '30%', left: '50%', fontSize: 12, animationDelay: '0.4s' }}>💚</span>
          </div>
        )}
      </div>

      {/* Damage/Heal number popup */}
      {showDamage !== null && (
        <div
          key={`dmg-${effectKey}`}
          className={`absolute font-pixel ${showDamage < 0 ? 'heal-number' : 'damage-number'}`}
          style={{
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: showDamage === 0 ? '0.6rem' : '0.75rem',
            fontWeight: 'bold',
            color: showDamage < 0 ? '#4ade80' : showDamage === 0 ? '#60a5fa' : '#f87171',
            textShadow: showDamage < 0
              ? '0 0 8px #4ade80, 0 2px 4px rgba(0,0,0,0.8)'
              : showDamage === 0
              ? '0 0 8px #60a5fa, 0 2px 4px rgba(0,0,0,0.8)'
              : '0 0 8px #f43f5e, 0 2px 4px rgba(0,0,0,0.8)',
            zIndex: 20,
          }}
        >
          {showDamage < 0 ? `+${Math.abs(showDamage)}` : showDamage === 0 ? 'GUARD!' : `-${showDamage}`}
        </div>
      )}
    </div>
  )
}

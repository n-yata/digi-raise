import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

type AnimState = 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead'

interface CreatureSpriteProps {
  type: CreatureType
  stage: EvolutionStage
  animState: AnimState
}

// Emoji base per type and stage
const SPRITE_EMOJIS: Record<CreatureType, string[]> = {
  Fire:    ['🥚', '🔴', '🦊', '🐉', '🔥', '☄️'],
  Water:   ['🥚', '🔵', '🐟', '🐋', '🌊', '🌀'],
  Plant:   ['🥚', '🟢', '🌱', '🌿', '🌸', '🌳'],
  Thunder: ['🥚', '🟡', '⚡', '🌩️', '🌪️', '⚡'],
  Dark:    ['🥚', '🟣', '👻', '💀', '🌑', '👁️'],
  Light:   ['🥚', '⭐', '✨', '🌟', '💫', '🌈'],
}

// Emoji-based body per stage
function PixelBody({ type, stage, color }: { type: CreatureType; stage: EvolutionStage; color: string }) {
  const sizes = [60, 80, 100, 120, 140, 160]
  const size = sizes[stage]
  const emoji = SPRITE_EMOJIS[type][stage]
  const emojiFontSizes = [40, 44, 48, 52, 64, 76]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Aura ring */}
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
      }} />
      {/* Decorative elements */}
      {stage >= 4 && (
        <>
          <div className="absolute" style={{ top: 0, left: 0, fontSize: 18, filter: 'blur(0.5px)' }}>✦</div>
          <div className="absolute" style={{ top: 0, right: 0, fontSize: 18, filter: 'blur(0.5px)' }}>✦</div>
        </>
      )}
      <div style={{ fontSize: emojiFontSizes[stage], lineHeight: 1, filter: `drop-shadow(0 0 8px ${color})` }}>
        {emoji}
      </div>
      {/* Power level indicator rings for high stages */}
      {stage >= 5 && (
        <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: color, opacity: 0.4 }} />
      )}
    </div>
  )
}

export default function CreatureSprite({ type, stage, animState }: CreatureSpriteProps) {
  const color = TYPE_COLORS[type]

  const getAnimClass = () => {
    switch (animState) {
      case 'happy':    return 'animate-happy-jump'
      case 'sleeping': return 'animate-idle-breathe opacity-70'
      case 'attack':   return 'animate-attack-flash'
      case 'evolving': return 'animate-evolve-glow'
      case 'dead':     return 'opacity-40 grayscale'
      case 'idle':
      default:         return 'animate-idle-breathe'
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Sleeping ZZZ */}
      {animState === 'sleeping' && (
        <div className="absolute -top-8 right-0 text-xl animate-sleep-zzz select-none z-10">
          💤
        </div>
      )}

      {/* Happy sparkles */}
      {animState === 'happy' && (
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute text-xs" style={{ top: '5%', left: '10%', animationDelay: '0s' }}>✨</span>
          <span className="absolute text-xs" style={{ top: '5%', right: '10%', animationDelay: '0.5s' }}>⭐</span>
        </div>
      )}

      {/* Main sprite */}
      <div className={`transition-all duration-300 ${getAnimClass()}`}>
        <PixelBody type={type} stage={stage} color={color} />
      </div>

      {/* Shadow */}
      <div
        className="rounded-full mt-1 opacity-30"
        style={{
          width: [40, 55, 70, 85, 100, 115][stage],
          height: 8,
          background: 'radial-gradient(ellipse, #000 0%, transparent 80%)',
        }}
      />
    </div>
  )
}

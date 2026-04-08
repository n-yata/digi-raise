import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

type AnimState = 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead' | 'sad' | 'hungry' | 'critical'

interface CreatureSpriteProps {
  type: CreatureType
  stage: EvolutionStage
  animState: AnimState
  customSvg?: string
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

// Pixel art body shapes per stage (CSS-based)
function PixelBody({ type, stage, color }: { type: CreatureType; stage: EvolutionStage; color: string }) {
  const sizes = [60, 80, 100, 120, 140, 160]
  const size = sizes[stage]

  // Stage 0: Egg
  if (stage === 0) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size * 1.2,
          background: `radial-gradient(ellipse at 40% 35%, white 0%, ${color}88 40%, ${color} 100%)`,
          borderRadius: '50% 50% 45% 45%',
          boxShadow: `0 0 20px ${color}88, inset 0 -10px 20px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Egg spots */}
        <div className="absolute" style={{
          width: 12, height: 8, borderRadius: '50%',
          background: `${color}cc`, top: '35%', left: '20%',
        }} />
        <div className="absolute" style={{
          width: 8, height: 6, borderRadius: '50%',
          background: `${color}aa`, top: '55%', left: '60%',
        }} />
      </div>
    )
  }

  // Stage 1: Baby - round blob
  if (stage === 1) {
    return (
      <div
        className="relative flex flex-col items-center"
        style={{ width: size, height: size }}
      >
        {/* Body */}
        <div style={{
          width: size,
          height: size * 0.8,
          background: `radial-gradient(circle at 40% 35%, ${color}ff 0%, ${color}bb 60%, ${color}88 100%)`,
          borderRadius: '50%',
          boxShadow: `0 0 15px ${color}66, inset 0 -8px 15px rgba(0,0,0,0.2)`,
          position: 'relative',
        }}>
          {/* Eyes */}
          <div className="absolute flex gap-2" style={{ top: '30%', left: '25%' }}>
            <div style={{ width: 8, height: 10, background: '#111', borderRadius: '40%' }}>
              <div style={{ width: 3, height: 3, background: 'white', borderRadius: '50%', margin: '1px 0 0 4px' }} />
            </div>
            <div style={{ width: 8, height: 10, background: '#111', borderRadius: '40%' }}>
              <div style={{ width: 3, height: 3, background: 'white', borderRadius: '50%', margin: '1px 0 0 4px' }} />
            </div>
          </div>
          {/* Mouth */}
          <div className="absolute" style={{
            width: 10, height: 5, bottom: '25%', left: '37%',
            borderBottom: '3px solid #111', borderRadius: '0 0 5px 5px',
          }} />
        </div>
        {/* Tiny feet */}
        <div className="flex gap-3 -mt-1">
          <div style={{ width: 14, height: 10, background: color, borderRadius: '50% 50% 40% 40%' }} />
          <div style={{ width: 14, height: 10, background: color, borderRadius: '50% 50% 40% 40%' }} />
        </div>
      </div>
    )
  }

  // Stage 2: Child - more defined
  if (stage === 2) {
    return (
      <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
        {/* Head */}
        <div style={{
          width: size * 0.65,
          height: size * 0.55,
          background: `radial-gradient(circle at 40% 35%, ${color}ff, ${color}99)`,
          borderRadius: '50% 50% 40% 40%',
          boxShadow: `0 0 12px ${color}55`,
          position: 'relative',
        }}>
          <div className="absolute flex gap-2" style={{ top: '25%', left: '18%' }}>
            <div style={{ width: 9, height: 11, background: '#111', borderRadius: '40%' }}>
              <div style={{ width: 3, height: 3, background: 'white', borderRadius: '50%', margin: '1px 0 0 5px' }} />
            </div>
            <div style={{ width: 9, height: 11, background: '#111', borderRadius: '40%' }}>
              <div style={{ width: 3, height: 3, background: 'white', borderRadius: '50%', margin: '1px 0 0 5px' }} />
            </div>
          </div>
          {/* Type feature on head */}
          <div className="absolute" style={{ top: -8, left: '42%', fontSize: 16 }}>
            {type === 'Fire' ? '🔥' : type === 'Water' ? '💧' : type === 'Plant' ? '🌿' :
             type === 'Thunder' ? '⚡' : type === 'Dark' ? '🌑' : '✨'}
          </div>
        </div>
        {/* Body */}
        <div style={{
          width: size * 0.55,
          height: size * 0.4,
          background: `linear-gradient(180deg, ${color}dd, ${color}99)`,
          borderRadius: '30% 30% 40% 40%',
          marginTop: -4,
        }} />
        {/* Legs */}
        <div className="flex gap-2 -mt-1">
          <div style={{ width: 16, height: 16, background: color, borderRadius: '40% 40% 50% 50%' }} />
          <div style={{ width: 16, height: 16, background: color, borderRadius: '40% 40% 50% 50%' }} />
        </div>
      </div>
    )
  }

  // Stage 3+: Adult and beyond - use large emoji + decorations
  const emoji = SPRITE_EMOJIS[type][stage]
  const emojiFontSizes = [0, 0, 0, 52, 64, 76]
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

export default function CreatureSprite({ type, stage, animState, customSvg }: CreatureSpriteProps) {
  const color = TYPE_COLORS[type]

  const getAnimClass = () => {
    switch (animState) {
      case 'happy':    return 'animate-happy-jump'
      case 'sleeping': return 'animate-idle-breathe opacity-70'
      case 'attack':   return 'animate-attack-flash'
      case 'evolving': return 'animate-evolve-glow'
      case 'dead':     return 'opacity-40 grayscale'
      case 'sad':      return 'animate-sad-sway'
      case 'hungry':   return 'animate-hungry-droop'
      case 'critical': return 'animate-critical-blink'
      case 'idle':
      default:         return 'animate-idle-breathe'
    }
  }

  const shadowWidth = [40, 55, 70, 85, 100, 115][stage]

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

      {/* Sad teardrops */}
      {animState === 'sad' && (
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute animate-sad-drop" style={{ top: '20%', left: '5%', fontSize: 14, animationDelay: '0s' }}>💧</span>
          <span className="absolute animate-sad-drop" style={{ top: '20%', right: '5%', fontSize: 14, animationDelay: '0.8s' }}>💧</span>
        </div>
      )}

      {/* Hungry callout */}
      {animState === 'hungry' && (
        <div className="absolute pointer-events-none animate-hungry-callout" style={{ top: '-28px', left: '50%', transform: 'translateX(-50%)', fontSize: 20, whiteSpace: 'nowrap' }}>
          🍖
        </div>
      )}

      {/* Critical warning */}
      {animState === 'critical' && (
        <div className="absolute pointer-events-none animate-critical-warn" style={{ top: '-28px', left: '50%', transform: 'translateX(-50%)', fontSize: 18, whiteSpace: 'nowrap' }}>
          ⚠️
        </div>
      )}

      {/* Main sprite */}
      <div className={`transition-all duration-300 ${getAnimClass()}`}>
        {customSvg ? (
          // User-drawn SVG (only user's own drawings are used here, XSS risk is accepted)
          <div
            style={{ width: 100, height: 100 }}
            dangerouslySetInnerHTML={{ __html: customSvg }}
          />
        ) : (
          <PixelBody type={type} stage={stage} color={color} />
        )}
      </div>

      {/* Shadow */}
      <div
        className="rounded-full mt-1 opacity-30"
        style={{
          width: shadowWidth,
          height: 8,
          background: 'radial-gradient(ellipse, #000 0%, transparent 80%)',
        }}
      />
    </div>
  )
}

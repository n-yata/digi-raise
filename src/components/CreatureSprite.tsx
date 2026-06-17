import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'
import { SPRITE_GRIDS, SPRITE_PIXEL_SIZE, buildPalette } from '../data/pixelSprites'

type AnimState = 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead'

interface CreatureSpriteProps {
  type: CreatureType
  stage: EvolutionStage
  animState: AnimState
}

// Pixel-art body per stage, recolored from the creature's type color.
function PixelBody({ stage, color }: { type: CreatureType; stage: EvolutionStage; color: string }) {
  const grid = SPRITE_GRIDS[stage]
  const palette = buildPalette(color)
  const pixel = SPRITE_PIXEL_SIZE[stage]
  const cols = grid[0].length
  const rows = grid.length

  return (
    <div className="relative flex items-center justify-center">
      {/* Aura ring */}
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
      }} />
      {/* Pixel grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${pixel}px)`,
          gridTemplateRows: `repeat(${rows}, ${pixel}px)`,
          filter: `drop-shadow(0 0 6px ${color}88)`,
          imageRendering: 'pixelated',
        }}
      >
        {grid.flatMap((row, y) =>
          row.split('').map((ch, x) => (
            <div key={`${x}-${y}`} style={{ background: palette[ch] ?? 'transparent' }} />
          ))
        )}
      </div>
      {/* Power level indicator ring for the final stage */}
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

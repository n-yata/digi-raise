import type { ReactNode } from 'react'
import type { CreatureId, EvolutionStage } from '../types/creature'
import { BRANCH_COLORS, getCreatureBranch } from '../data/evolutions'
import { STAGE_SIZES } from '../data/spriteConfig'
import { DefaultCreatureBody } from './creatures/DefaultCreatureBody'
import type { AnimState } from './creatures/DefaultCreatureBody'
import { PixelSprite, getEggPixel, getPixelSprite } from './creatures/pixel'

interface CreatureSpriteProps {
  creatureId: CreatureId
  stage: EvolutionStage
  animState: AnimState
  customSvg?: ReactNode
}

function getAnimClass(animState: AnimState): string {
  switch (animState) {
    case 'happy':    return 'animate-happy-jump'
    case 'eating':   return 'animate-eat-nod'
    case 'sleeping': return 'animate-idle-breathe opacity-70'
    case 'attack':   return 'animate-attack-lunge'
    case 'evolving': return 'animate-evolve-glow'
    case 'dead':     return 'opacity-40 grayscale'
    case 'sad':      return 'animate-sad-sway'
    case 'hungry':   return 'animate-hungry-droop'
    case 'critical': return 'animate-critical-blink'
    case 'walking':  return 'animate-walk-bounce'
    case 'idle':
    default:         return 'animate-idle-breathe'
  }
}

export default function CreatureSprite({ creatureId, stage, animState, customSvg }: CreatureSpriteProps) {
  const branch = getCreatureBranch(creatureId)
  const color = BRANCH_COLORS[branch]
  const size = STAGE_SIZES[stage]
  const shadowWidth = [40, 55, 70, 85, 100, 115][stage]

  const pixelData = stage > 0 ? getPixelSprite(creatureId) : null
  const body = customSvg ?? (
    stage === 0
      ? <PixelSprite data={getEggPixel(color)} size={size} />
      : pixelData
        ? <PixelSprite data={pixelData} size={size} animState={animState} />
        : <DefaultCreatureBody color={color} stage={stage} animState={animState} />
  )

  return (
    <div className="relative flex flex-col items-center justify-center">
      {animState === 'sleeping' && (
        <div className="absolute -top-8 right-0 text-sm font-pixel animate-sleep-zzz select-none z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Zzz
        </div>
      )}

      <div className={`creature-sprite transition-all duration-300 ${getAnimClass(animState)}`}>
        {body}
      </div>

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

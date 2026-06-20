import type { FC } from 'react'
import type { EvolutionStage } from '../../types/creature'
import { STAGE_SIZES } from '../../data/spriteConfig'
import { FallbackSilhouette } from './FallbackSilhouette'

export type AnimState = 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead' | 'sad' | 'hungry' | 'critical' | 'eating' | 'walking'
export type EyeVariant = 'normal' | 'angry' | 'closed'
export type MouthVariant = 'smile' | 'fang' | 'small' | 'open'

export function getExpression(animState: AnimState, highStage = false): { eye: EyeVariant; mouth: MouthVariant } {
  switch (animState) {
    case 'sleeping':
    case 'dead':
      return { eye: 'closed', mouth: 'small' }
    case 'attack':
      return { eye: 'angry', mouth: 'fang' }
    case 'happy':
    case 'eating':
      return { eye: 'normal', mouth: 'open' }
    case 'sad':
    case 'hungry':
      return { eye: 'closed', mouth: 'small' }
    case 'critical':
      return { eye: 'angry', mouth: 'small' }
    default:
      return { eye: highStage ? 'angry' : 'normal', mouth: highStage ? 'fang' : 'smile' }
  }
}

export interface SpriteProps {
  color: string
  size: number
  animState: AnimState
}

export type StageSpriteMap = Partial<Record<Exclude<EvolutionStage, 0>, FC<SpriteProps>>>

export function hasDefaultSprite(_stage: EvolutionStage): boolean {
  return false
}

interface DefaultCreatureBodyProps {
  color: string
  stage: EvolutionStage
  animState: AnimState
}

export function DefaultCreatureBody({ color, stage, animState }: DefaultCreatureBodyProps) {
  const size = STAGE_SIZES[stage]
  if (stage === 0) return null
  return <FallbackSilhouette color={color} size={size} stage={stage} animState={animState} />
}

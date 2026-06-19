import type { FC } from 'react'
import type { CreatureType, EvolutionStage } from '../../types/creature'
import { TYPE_COLORS } from '../../data/evolutions'
import { STAGE_SIZES } from '../../data/spriteConfig'
import { FallbackSilhouette } from './FallbackSilhouette'
import { FireSprites } from './FireSprites'
import { WaterSprites } from './WaterSprites'
import { PlantSprites } from './PlantSprites'
import { ThunderSprites } from './ThunderSprites'
import { DarkSprites } from './DarkSprites'
import { LightSprites } from './LightSprites'

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

const SPRITE_DISPATCH: Record<CreatureType, StageSpriteMap> = {
  Normal: {},
  Fire: FireSprites,
  Water: WaterSprites,
  Plant: PlantSprites,
  Thunder: ThunderSprites,
  Dark: DarkSprites,
  Light: LightSprites,
}

export function hasDefaultSprite(type: CreatureType, stage: EvolutionStage): boolean {
  if (stage === 0) return false
  return Boolean(SPRITE_DISPATCH[type]?.[stage as Exclude<EvolutionStage, 0>])
}

interface DefaultCreatureBodyProps {
  type: CreatureType
  stage: EvolutionStage
  animState: AnimState
}

export function DefaultCreatureBody({ type, stage, animState }: DefaultCreatureBodyProps) {
  const color = TYPE_COLORS[type]
  const size = STAGE_SIZES[stage]
  if (stage === 0) return null
  const SpriteComp = SPRITE_DISPATCH[type]?.[stage as Exclude<EvolutionStage, 0>]
  if (!SpriteComp) return <FallbackSilhouette color={color} size={size} stage={stage} animState={animState} />
  return <SpriteComp color={color} size={size} animState={animState} />
}

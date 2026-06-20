import type { CreatureId } from '../../../types/creature'
import type { PixelSpriteData } from './PixelSprite'
import { babySprite } from './sprites/baby'
import { childASprite } from './sprites/childA'
import { childBSprite } from './sprites/childB'
import { childCSprite } from './sprites/childC'
import { adultA1Sprite } from './sprites/adultA1'
import { adultA2Sprite } from './sprites/adultA2'
import { adultB1Sprite } from './sprites/adultB1'
import { adultB2Sprite } from './sprites/adultB2'
import { adultC1Sprite } from './sprites/adultC1'
import { adultC2Sprite } from './sprites/adultC2'
import { perfectA1Sprite } from './sprites/perfectA1'
import { perfectA2Sprite } from './sprites/perfectA2'
import { perfectB1Sprite } from './sprites/perfectB1'
import { perfectB2Sprite } from './sprites/perfectB2'
import { perfectC1Sprite } from './sprites/perfectC1'
import { perfectC2Sprite } from './sprites/perfectC2'
import { ultimateASprite } from './sprites/ultimateA'
import { ultimateBSprite } from './sprites/ultimateB'
import { ultimateCSprite } from './sprites/ultimateC'

export type { PixelSpriteData }
export { PixelSprite } from './PixelSprite'
export { getEggPixel } from './egg'

const SPRITE_MAP: Partial<Record<CreatureId, PixelSpriteData>> = {
  baby: babySprite,
  childA: childASprite,
  childB: childBSprite,
  childC: childCSprite,
  adultA1: adultA1Sprite,
  adultA2: adultA2Sprite,
  adultB1: adultB1Sprite,
  adultB2: adultB2Sprite,
  adultC1: adultC1Sprite,
  adultC2: adultC2Sprite,
  perfectA1: perfectA1Sprite,
  perfectA2: perfectA2Sprite,
  perfectB1: perfectB1Sprite,
  perfectB2: perfectB2Sprite,
  perfectC1: perfectC1Sprite,
  perfectC2: perfectC2Sprite,
  ultimateA: ultimateASprite,
  ultimateB: ultimateBSprite,
  ultimateC: ultimateCSprite,
}

export function getPixelSprite(creatureId: CreatureId): PixelSpriteData | null {
  return SPRITE_MAP[creatureId] ?? null
}

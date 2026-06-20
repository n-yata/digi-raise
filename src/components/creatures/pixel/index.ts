import type { CreatureId } from '../../../types/creature'
import type { PixelSpriteData } from './PixelSprite'

export type { PixelSpriteData }
export { PixelSprite } from './PixelSprite'
export { getEggPixel } from './egg'

export function getPixelSprite(_creatureId: CreatureId): PixelSpriteData | null {
  return null
}

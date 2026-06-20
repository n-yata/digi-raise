import type { CreatureType, EvolutionStage } from '../../../types/creature'
import type { PixelSpriteData } from './PixelSprite'
import { getFaceAnchors } from './faces'

import { fireBabyPixel } from './fireBaby'
import { fireChildPixel } from './fireChild'
import { fireAdultPixel } from './fireAdult'
import { firePerfectPixel } from './firePerfect'
import { fireUltimatePixel } from './fireUltimate'

import { waterBabyPixel } from './waterBaby'
import { waterChildPixel } from './waterChild'
import { waterAdultPixel } from './waterAdult'
import { waterPerfectPixel } from './waterPerfect'
import { waterUltimatePixel } from './waterUltimate'

import { plantBabyPixel } from './plantBaby'
import { plantChildPixel } from './plantChild'
import { plantAdultPixel } from './plantAdult'
import { plantPerfectPixel } from './plantPerfect'
import { plantUltimatePixel } from './plantUltimate'

import { thunderBabyPixel } from './thunderBaby'
import { thunderChildPixel } from './thunderChild'
import { thunderAdultPixel } from './thunderAdult'
import { thunderPerfectPixel } from './thunderPerfect'
import { thunderUltimatePixel } from './thunderUltimate'

import { darkBabyPixel } from './darkBaby'
import { darkChildPixel } from './darkChild'
import { darkAdultPixel } from './darkAdult'
import { darkPerfectPixel } from './darkPerfect'
import { darkUltimatePixel } from './darkUltimate'

import { lightBabyPixel } from './lightBaby'
import { lightChildPixel } from './lightChild'
import { lightAdultPixel } from './lightAdult'
import { lightPerfectPixel } from './lightPerfect'
import { lightUltimatePixel } from './lightUltimate'

export type { PixelSpriteData }
export { PixelSprite } from './PixelSprite'

/**
 * タイプ × ステージ → ドット絵データの対応表（6タイプ × 5ステージ = 30体）。
 * 未登録の組み合わせ（Normal や卵 stage 0）はここに無く、呼び出し側で従来 SVG にフォールバックする。
 * テストから走査するため export する。
 */
export const PIXEL_DISPATCH: Partial<Record<CreatureType, Partial<Record<EvolutionStage, PixelSpriteData>>>> = {
  Fire:    { 1: fireBabyPixel,    2: fireChildPixel,    3: fireAdultPixel,    4: firePerfectPixel,    5: fireUltimatePixel },
  Water:   { 1: waterBabyPixel,   2: waterChildPixel,   3: waterAdultPixel,   4: waterPerfectPixel,   5: waterUltimatePixel },
  Plant:   { 1: plantBabyPixel,   2: plantChildPixel,   3: plantAdultPixel,   4: plantPerfectPixel,   5: plantUltimatePixel },
  Thunder: { 1: thunderBabyPixel, 2: thunderChildPixel, 3: thunderAdultPixel, 4: thunderPerfectPixel, 5: thunderUltimatePixel },
  Dark:    { 1: darkBabyPixel,    2: darkChildPixel,    3: darkAdultPixel,    4: darkPerfectPixel,    5: darkUltimatePixel },
  Light:   { 1: lightBabyPixel,   2: lightChildPixel,   3: lightAdultPixel,   4: lightPerfectPixel,   5: lightUltimatePixel },
}

export function getPixelSprite(type: CreatureType, stage: EvolutionStage): PixelSpriteData | null {
  const data = PIXEL_DISPATCH[type]?.[stage]
  if (!data) return null
  const face = getFaceAnchors(type, stage)
  return face ? { ...data, face } : data
}

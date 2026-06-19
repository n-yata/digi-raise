import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Fire 究極体（stage 5 / Ultimate）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準。
 * 4頭身・最大（最大横幅26px）。背後に燃え立つ光背の炎・頭の大角・装甲化した体・鋭い吊り目を持つ赤橙の炎の獣の最終形態。
 * 色は paletteFor('Fire')（k/o/d/r/l/c/w/b ＋ 炎アクセント y/g）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '..y...y...yy.yy.yy...y...y......',
  '.ygy.ygy.yygyygyyg.ygy.ygy......',
  '.yggyyggyyggggggggggggyyggy.....',
  '..yggggggggggggggggggggggy......',
  '...ggggrrrrrrrrrrrrrrgggg.......',
  '....kkkkkkkkkkkkkkkkkkkk........',
  '...krrrrrrrrrrrrrrrrrrrrk.......',
  '..krrrrlllrrrrrrrrrrrrrrrk......',
  '..krrrrlllrrrrrrrrrrddrrrrk.....',
  '.krrrrrrrrrrrrrrrrrrrrrrrrrk....',
  '.krrrrrrrrrrrrrrrrrrrrrrrrrk....',
  '.krrwwwwrrrrrrrrrrrrrrwwwwrk....',
  '.krrwbbwrrrrrrrrrrrrrrwbbwrk....',
  '.krrwwwwrrrrrrrrrrrrrrwwwwrk....',
  '.krrrrrrrrrrrrrrrrrrrrrrrrrk....',
  '.krrrrrrrrrkkkkkkkkrrrrrrrrk....',
  '.krrrrrrrrrwwwwwwwwrrrrrrrrk....',
  '..krrrcccccccccccccccccrrk......',
  '..krrccccccccccccccccccccrk.....',
  '..krrccccccccccccccccccccrk.....',
  '..krrccccccccccccccccccccrk.....',
  '..krrccccccccccccccccccccrk.....',
  '...krrcccccccccccccccccrrk......',
  '...krrroooooooooooooorrrk.......',
  '...krrrk..........krrrk.........',
  '..krrrrk..........krrrrk........',
  '..krrook..........koorrk........',
  '.krrrook..........koorrrk.......',
  '.krooook..........koooork.......',
  '.kkkkkkk..........kkkkkkk.......',
  '................................',
  '................................',
]

export const fireUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Fire') }

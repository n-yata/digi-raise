import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Dark 究極体（stage 5 / Ultimate）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準。
 * 4頭身・最大（最大横幅26px）。背後に渦巻く闇のオーラ（紫炎）・頭の巨大な多重角・装甲化した体・鋭い吊り目を持つ闇の獣の最終形態。
 * 色は paletteFor('Dark')（k/o/d/r/l/c/w/b ＋ 闇アクセント a 紫炎 / s 妖光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '..a...a...aa.aa.aa...a...a......',
  '.aka.aka.aakaakaaka.aka.aka.....',
  '.akaaakaaaakkkkkkaaaakaaaka.....',
  '..akakaaakrrrrrrrrkaaakaka......',
  '...akakkrrrrrrrrrrrrkkaka.......',
  '....kkrrrrrrrrrrrrrrrrkk........',
  '...krrrrrrrrrrrrrrrrrrrrk.......',
  '..krrrrlllrrrrrrrrrrrrrrrk......',
  '..krrrrlllrrrrrrrrrrrrddrk......',
  '.krrrrrrrrrrrrrrrrrrrrrrrrk.....',
  '.krrrrrrrrrrrrrrrrrrrrrrrrk.....',
  '.krrwwwwrrrrrrrrrrrrwwwwrrk.....',
  '.krwbbbwrrrrrrrrrrrrwbbbwrk.....',
  '.krrwwwwrrrrrrrrrrrrwwwwrrk.....',
  '.krrrrrrrrrrrrrrrrrrrrrrrrk.....',
  '.krrrrrrrrrkkkkkkrrrrrrrrrk.....',
  '.krrrrrrraaaaaaaaaarrrrrrrk.....',
  '.akrrrraaaaaaaaaaaaaarrrrka.....',
  'saksrrrcccccccccccccrrrrksas....',
  'saksrrcccccccccccccccrrrksas....',
  'saksrrcccccccccccccccrrrksas....',
  '.akrrrccccccccccccccrrrrka......',
  '..krrrooooooooooooorrrrk........',
  '..krrrk............krrrrk.......',
  '.krrrrk............krrrrrk......',
  '.krrook............koorrrk......',
  'krrrook............koorrrrk.....',
  'krooook............koooork......',
  'kkkkkkk............kkkkkkk......',
  '................................',
  '................................',
  '................................',
]

export const darkUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Dark') }

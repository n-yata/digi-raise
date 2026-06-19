import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Thunder 究極体（stage 5）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準。
 * 最大の雷獣。巨大な稲妻ツノ・帯電する光背・重厚な体躯を持つ最強の電気の獣。
 * 稲妻装飾を最大に（y 白閃 / a 黄電）。色は paletteFor('Thunder') に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  'y...a....a.......a....a...a....y',
  '.y..aa..aa.......aa..aa..aa...y.',
  '..y.aak.ak.......ka.kaa.ak..y...',
  '...yaakkak.......kakkaa.ak.y....',
  'a...kkrrrkkkkkkkkkkrrrkk...a....',
  'aa.kkrrrrrrrrrrrrrrrrrrkk..aa...',
  '.akkrrrrrrrrrrrrrrrrrrrrrkka....',
  '.klllrrrrrrrrrrrrrrrrrrrrrddk...',
  '.kllrrrrrrrrrrrrrrrrrrrrrrrddk..',
  '.klrrrrrrrrrrrrrrrrrrrrrrrrddk..',
  '.klrrwwwwrrrrrrrrrrrrwwwwrrddk..',
  '.klrrwbbwrrrrrrrrrrrrwbbwrrddk..',
  '.klrrwwwwrrrrrrrrrrrrwwwwrrddk..',
  '.klrrrrrrrrrrrrrrrrrrrrrrrrddk..',
  '..klrrrrrrkkkkkkkkkkrrrrrrddk...',
  '..klrrrrrrwwwwwwwwwwrrrrrrddk...',
  '..klrrrccccccccccccccccrrddk....',
  '..klrrcccccccccccccccccccrddk...',
  '..klrccccccccccccccccccccrddk.a.',
  '..klrcccccccccccccccccccrddkaaak',
  '...klrcccccccccccccccccrddkaaak.',
  '...klrrcccccccccccccccrrddkaak..',
  '...klrrooooooooooooooorrddkak...',
  '...kkdrrrk........krrrddkk......',
  '...kkdrrk..........krrdkk.......',
  '...kddrk............krddk.......',
  '...kdddk............kdddk.......',
  '...koook............koook.......',
  '...kkkkk............kkkkk.......',
  '..y......................y......',
  '.y........................y.....',
  'y..........................y....',
]

export const thunderUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Thunder') }

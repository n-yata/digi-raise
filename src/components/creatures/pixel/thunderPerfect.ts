import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Thunder 完全体（stage 4）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 大型化した雷獣。大きな稲妻ツノ・帯電する翼状トゲ・鋭い双眼を持つ迫力ある電気の獣。
 * 稲妻装飾を大きく（y 白閃 / a 黄電）。色は paletteFor('Thunder') に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '..........a.........a...........',
  '.........aa.........aa..........',
  '........aak.........kaa.........',
  '.......aakk.........kkaa........',
  'a.....aakrrkkkkkkkkkrrkaa.....a.',
  'aa...kkrrrrrrrrrrrrrrrrrkk...aa.',
  '.akkkrrrrrrrrrrrrrrrrrrrrrkkka..',
  '..klllrrrrrrrrrrrrrrrrrrrrddk...',
  '..klllrrrrrrrrrrrrrrrrrrrrddk...',
  '..klrrwwwwrrrrrrrrrrwwwwrrddk...',
  '..klrrwbbwrrrrrrrrrrwbbwrrddk...',
  '..klrrwwwwrrrrrrrrrrwwwwrrddk...',
  '..klrrrrrrrrrrrrrrrrrrrrrrddk...',
  '...klrrrrrrkkkkkkkkrrrrrrddk....',
  '...klrrrrrrwwwwwwwwrrrrrrddk....',
  '...klrrrcccccccccccccrrrddk.....',
  '...klrrccccccccccccccccrddk.....',
  '....klrccccccccccccccccrddk.aa..',
  '....klrcccccccccccccccrddkaaak..',
  '....klrrccccccccccccrrddkaaak...',
  '.....klrroooooooooorrddkaaak....',
  '.....klrrrk......krrrddk.aak....',
  '.....kdrrk........krrdk..ak.....',
  '....kkdrk..........kdrkk........',
  '....klddk..........kddlk........',
  '....kdddk..........kdddk........',
  '....koook..........koook........',
  '....kkkkk..........kkkkk........',
  '...y..................y.........',
  '..y....................y........',
  '.y......................y.......',
  '................................',
]

export const thunderPerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Thunder') }

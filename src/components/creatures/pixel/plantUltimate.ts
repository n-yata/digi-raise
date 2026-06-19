import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Plant 究極体（stage 5 / Ultimate）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準。
 * 4頭身・最大（最大横幅26px）。頭上に咲く巨大な大輪の花・背後に広がる葉の光背・穏やかな目・淡色のお腹を持つ重厚な緑の植物の獣。
 * 色は paletteFor('Plant')（k/o/d/r/l/c/w/b ＋ 葉アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '.........aa..asssa..aa..........',
  '........aaa.asssssa.aaa.........',
  '.......aaaaassssssaaaaaa........',
  '......aaaaaasssssaaaaaaaa.......',
  '.....aaaaaaarrrrrraaaaaaaa......',
  '.....aaarrrrrrrrrrrrrraaaa......',
  '.....kkkkkkkkkkkkkkkkkkkk.......',
  'a...krrrrrrrrrrrrrrrrrrrrrrk...a',
  'aa.krrrlllrrrrrrrrrrrrrddrrrk.aa',
  'aaakrrrlllrrrrrrrrrrrrrddrrrkaaa',
  'aaakrrrrrrrrrrrrrrrrrrrrrrrrkaaa',
  '.aakrrwwwrrrrrrrrrrrrrwwwrrrkaa.',
  '..akrrwbwrrrrrrrrrrrrrwbwrrrka..',
  '...krrwwwrrrrrrrrrrrrrwwwrrrk...',
  '...krrrrrrrrrrrrrrrrrrrrrrrrk...',
  '...krrrrrrrrkkkkkkkkrrrrrrrrk...',
  '...krrrrrrrrwwwwwwwwrrrrrrrk....',
  '...krrrrcccccccccccccccrrrk.a...',
  '...krrrcccccccccccccccccrrkaaa..',
  '...krrrcccccccccccccccccrrkaaaa.',
  '...krrrcccccccccccccccccrrk.aaa.',
  '....krrcccccccccccccccccrk..aa..',
  '....krrrcccccccccccccccrrk.a....',
  '.....krrooooooooooooooorrk......',
  '.....krrrooooooooooorrrrk.......',
  '.....krrrk........krrrk.........',
  '....krrrrk........krrrrk........',
  '....krrook........koorrk........',
  '....kooook........kooork........',
  '....kkkkkk........kkkkkk........',
  '................................',
  '................................',
]

export const plantUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Plant') }

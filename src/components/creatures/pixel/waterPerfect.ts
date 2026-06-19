import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Water 完全体（stage 4）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 大型・3.5頭身。大きな背ビレ・側面のヒレ・鋭い角・凛々しい目・淡色のお腹・水しぶき（a 白青 / s 濃青）を持つ。
 * 色は paletteFor('Water')（k/o/d/r/l/c/w/b ＋ 水アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '.........k....k....k............',
  '........ksk..kak..ksk...........',
  '......kakaskakakaksakak.........',
  '.....kaarrrrrrrrrrrrraak........',
  '.......kkkkkkkkkkkkkkkk.........',
  '.....krrrrrrrrrrrrrrrrrrk.......',
  '....akrllrrrrrrrrrrrrddrka......',
  '...sakrrrrrrrrrrrrrrrrrrkas.....',
  '...askrrwwwwrrrrrrwwwwrrksa.....',
  '....krrwwbwwrrrrrrwwbwwrrk......',
  '....krrwwwwwrrrrrrwwwwwrrk......',
  '....krrrrrrrrrrrrrrrrrrrrk......',
  '....krrrrrrrkkkkkkrrrrrrrk......',
  '.....krrrrrrwwwwrrrrrrrrk.......',
  '.....krrrrccccccccccrrrrk.......',
  '.....krrrcccccccccccccrrk.......',
  '.....krrcccccccccccccccrk.s.....',
  '.....krrcccccccccccccccrkas.....',
  '.....krrrcccccccccccccrrkaaa....',
  '......krrrcccccccccccrrk.sas....',
  '......krrrooooooooooorrk.sa.....',
  '......kroooooooooooooork.s......',
  '......krrk..........krrk........',
  '.....krrrk..........krrrk.......',
  '.....krrk............krrk.......',
  '....krrrk............krrrk......',
  '....koook............koook......',
  '....kkkkk............kkkkk......',
  '................................',
  '................................',
  '................................',
]

export const waterPerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Water') }

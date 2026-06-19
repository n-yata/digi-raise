import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Water 成長期（stage 3）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準（プロト fireAdult 準拠）。
 * 3頭身・二足の水棲獣。頭の背ビレ・凛々しい目・淡色のお腹・水しぶきのしっぽ（a 白青 / s 濃青）を持つ青い獣。
 * 色は paletteFor('Water')（k/o/d/r/l/c/w/b ＋ 水アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...........k...k...k............',
  '..........kak.kak.kak...........',
  '.........kakaaaaaaaaakak........',
  '........kaarrrrrrrrrraak........',
  '..........kkkkkkkkkkkk..........',
  '........krrrrrrrrrrrrrrk........',
  '........krllrrrrrrrrddrk........',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrwbwrrrrrrwbwrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrrkkkkrrrrrrk.......',
  '........krrrrrwwrrrrrrrk........',
  '........krrrrccccccrrrrk.s......',
  '........krrrccccccccrrrk.as.....',
  '........krrrccccccccrrrkasaa....',
  '........krrrccccccccrrrkaaas....',
  '.........krrccccccccrrk.sa......',
  '.........krrccccccccrrk.s.......',
  '..........krccccccccrk..........',
  '..........kroooooooork..........',
  '..........krroooooorrk..........',
  '..........krrk....krrk..........',
  '.........krrrk....krrrk.........',
  '.........koook....koook.........',
  '.........kkkkk....kkkkk.........',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const waterAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Water') }

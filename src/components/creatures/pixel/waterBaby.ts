import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Water 幼体（stage 1）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 2頭身・丸い水棲の幼体。頭の小さなヒレ・淡色のお腹・水しぶき（a 白青）を持つ青い水の子。
 * 色は paletteFor('Water')（k/o/d/r/l/c/w/b ＋ 水アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '...............k................',
  '..............krk...............',
  '.............krrrk..............',
  '............kkkkkkk.............',
  '..........kkrrrrrrrrkk..........',
  '.........krrrrrrrrrrrrk.........',
  '........krrllrrrrrrrrrrk........',
  '........krrllrrrrrrrrddk........',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrwbwrrrrrrwbwrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrccccccccrrrrk.......',
  '.......krrrcccccccccccrrk.......',
  '.......krrrcccccccccccrrk.......',
  '.......krrrcccccccccccrrk.......',
  '........krrcccccccccccrk.a......',
  '........krrrccccccccrrrk.s......',
  '.........krrrooooooorrk.........',
  '..........kroooooooork..........',
  '...........kkrrrrkk.............',
  '...........krrk.krrk............',
  '..........krrk...krrk...........',
  '..........koook..koook..........',
  '..........kkkkk..kkkkk..........',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const waterBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Water') }

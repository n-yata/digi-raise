import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Dark 幼年期（stage 1 / Baby）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 2頭身・ほぼ球の丸い幼体（最大横幅16px）。頭の小さな角・吊り目・淡色のお腹を持つ闇の獣の赤ちゃん。
 * 色は paletteFor('Dark')（k/o/d/r/l/c/w/b ＋ 闇アクセント a 紫炎 / s 妖光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '...........a........a...........',
  '..........aka......aka..........',
  '..........kkk......kkk..........',
  '............kkkkkkkkk...........',
  '..........krrrrrrrrrrk..........',
  '.........krrrrrrrrrrrrk.........',
  '........krrrlllrrrrrrrrk........',
  '........krrrlllrrrrrrrrk........',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krwbbwrrrrrrwbbwrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrrkkkkrrrrrrk.......',
  '.......krrrrraaaaaarrrrrk.......',
  '.......krrcccccccccccrrrk.......',
  '........krccccccccccccrk........',
  '........krccccccccccccrk........',
  '.........krccccccccccrk.........',
  '.........krrccccccccrrk.........',
  '..........krroooooorrk..........',
  '...........kroooooork...........',
  '...........krrk..krrk...........',
  '..........krrrk..krrrk..........',
  '..........koook..koook..........',
  '..........kkkkk..kkkkk..........',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const darkBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Dark') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Water 成長期前段（stage 2）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 2.5頭身・短い四肢の水棲幼獣。背ビレ・大きな目・淡色のお腹・水しぶき（a 白青 / s 濃青）を持つ。
 * 色は paletteFor('Water')（k/o/d/r/l/c/w/b ＋ 水アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...............k................',
  '..............kak...............',
  '.............kaak...............',
  '...........kkkkkkkk.............',
  '.........kkrrrrrrrrrkk..........',
  '........krrrrrrrrrrrrrk.........',
  '.......krrllrrrrrrrrrrrk........',
  '.......krrllrrrrrrrrrddk........',
  '......krrrrrrrrrrrrrrrrrk.......',
  '......krrwwwwrrrrrrwwwwrk.......',
  '......krrwwbwrrrrrrwbwwrk.......',
  '......krrwwwwrrrrrrwwwwrk.......',
  '......krrrrrrrrrrrrrrrrrk.......',
  '......krrrrrccccccccrrrrk.......',
  '.......krrrcccccccccccrk........',
  '.......krrrcccccccccccrk........',
  '.......krrrcccccccccccrk.a......',
  '........krrcccccccccrrk..s......',
  '........krrrccccccccrrk.........',
  '.........krrooooooorrk..........',
  '.........kroooooooork...........',
  '.........krrk....krrk...........',
  '.........krrk....krrk...........',
  '........krrk......krrk..........',
  '........krrk......krrk..........',
  '.......krrrk......krrrk.........',
  '.......koook......koook.........',
  '.......kkkkk......kkkkk.........',
  '................................',
  '................................',
  '................................',
]

export const waterChildPixel: PixelSpriteData = { grid, palette: paletteFor('Water') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Dark 成長期（stage 2 / Child）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 2.5頭身（最大横幅18px）。伸び始めた角・短い四肢・大きな吊り目を持つ闇の獣の幼体。
 * 色は paletteFor('Dark')（k/o/d/r/l/c/w/b ＋ 闇アクセント a 紫炎 / s 妖光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '..........a..........a..........',
  '.........aka........aka.........',
  '.........aka........aka.........',
  '.........kkk........kkk.........',
  '...........kkkkkkkkkk...........',
  '.........krrrrrrrrrrrrk.........',
  '........krrrrrrrrrrrrrrk........',
  '.......krrrlllrrrrrrrrrrk.......',
  '.......krrrlllrrrrrrrrrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwwrrrrwwwwrrk.......',
  '.......krwbbbwrrrrwbbbwrk.......',
  '.......krrwwwwrrrrwwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrkkkkkkrrrrrk.......',
  '........krrrraaaaaarrrrk........',
  '........krrcccccccccrrrk........',
  '........krrcccccccccrrrk........',
  '.........krccccccccccrk.........',
  '.........krrccccccccrrk.........',
  '.........krk.dd..dd.krk.........',
  '.........krk........krk.........',
  '........krrk........krrk........',
  '........krrk........krrk........',
  '.......krrrk........krrrk.......',
  '.......koook........koook.......',
  '.......kkkk..........kkkk.......',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const darkChildPixel: PixelSpriteData = { grid, palette: paletteFor('Dark') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Fire 成長期（stage 3）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準。
 * 頭の炎・大きな目・クリーム色のお腹・二足・しっぽの炎を持つ赤橙の炎の獣。
 * 色は paletteFor('Fire')（k/o/d/r/l/c/w/b ＋ 炎アクセント y/g）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...........y...y...y............',
  '..........yyy.yyy.yyy...........',
  '.........gyggggyggggyg..........',
  '........gggrrrrrrrrrggg.........',
  '..........kkkkkkkkkkkk..........',
  '........krrrrrrrrrrrrrrk........',
  '........krllrrrrrrrrddrk........',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrwbwrrrrrrwbwrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrrkkkkrrrrrrk.......',
  '........krrrrrrwwrrrrrrk........',
  '........krrrrccccccrrrrk.g......',
  '........krrrccccccccrrrkggy.....',
  '........krrrccccccccrrrkgyg.....',
  '........krrrccccccccrrrkgyyg....',
  '.........krrccccccccrrk.gy......',
  '.........krrccccccccrrk.g.......',
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

export const fireAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Fire') }

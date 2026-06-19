import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Fire 成長期前段（stage 2 / Child）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 2.5頭身・短い四肢が生えた幼体（最大横幅18px）。大きな目・頭としっぽの炎・クリーム色のお腹を持つ赤橙の炎の獣。
 * 色は paletteFor('Fire')（k/o/d/r/l/c/w/b ＋ 炎アクセント y/g）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '..............y.y.y.............',
  '.............yyygyyy............',
  '............ygggggggy...........',
  '...........kkkkkkkkkkk..........',
  '..........krrrrrrrrrrrk.........',
  '.........krrlllrrrrrrrrk........',
  '........krrrlllrrrrrrrrrk.......',
  '........krrrrrrrrrrrrrrrk.......',
  '........krwwwrrrrrrwwwrrk.......',
  '........krwbwrrrrrrwbwrrk.......',
  '........krwwwrrrrrrwwwrrk.......',
  '........krrrrrrrrrrrrrrrk.......',
  '........krrrrrkkkkrrrrrrk.g.....',
  '........krrrrrwwwwrrrrrkggy.....',
  '........krrcccccccccrrrkgyg.....',
  '........krccccccccccrrkgyyg.....',
  '........krccccccccccrrk.gy......',
  '........krccccccccccrrk.g.......',
  '.........krcccccccccrk..........',
  '.........krrccccccccrk..........',
  '..........krroooooork...........',
  '..........krrk..krrk............',
  '.........krrrk..krrrk...........',
  '.........krrok..korrk...........',
  '.........koook..koook...........',
  '.........kkkkk..kkkkk...........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const fireChildPixel: PixelSpriteData = { grid, palette: paletteFor('Fire') }

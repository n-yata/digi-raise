import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Plant 成長期前段（stage 2 / Child）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 2.5頭身・短い四肢が生えた幼体（最大横幅18px）。頭の葉の冠と花のつぼみ・大きな穏やかな目・淡色のお腹を持つ緑の植物の獣。
 * 色は paletteFor('Plant')（k/o/d/r/l/c/w/b ＋ 葉アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '..............s.................',
  '............asasa...............',
  '...........aaaaaaa..............',
  '..........a.aaaaa.a.............',
  '...........kkkkkkkkkk...........',
  '.........krrrrrrrrrrrrk.........',
  '........krrlllrrrrrrrrrk........',
  '.......krrrlllrrrrrrrrrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrwbwrrrrrrwbwrrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '........krrrcccccccccrrk........',
  '........krrcccccccccccrk.a......',
  '........krrcccccccccccrkaaa.....',
  '........krrcccccccccccrk.aa.....',
  '.........krrccccccccccrk........',
  '.........krrrccccccccrrk........',
  '..........krroooooooork.........',
  '..........krrk....krrk..........',
  '.........krrrk....krrrk.........',
  '.........krrok....korrk.........',
  '.........koook....koook.........',
  '.........kkkkk....kkkkk.........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const plantChildPixel: PixelSpriteData = { grid, palette: paletteFor('Plant') }

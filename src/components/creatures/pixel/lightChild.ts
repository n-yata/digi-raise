import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Light 成長期前段（stage 2 / Child）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 2.5頭身・短い四肢が生えた幼体（最大横幅18px）。頭上の光輪・大きな優しい目・淡色のお腹・小さな白い翼を持つ淡黄〜白の聖獣。
 * 色は paletteFor('Light')（k/o/d/r/l/c/w/b ＋ 光アクセント a 白輝 / s 金光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '.............ssssssss...........',
  '............s........s..........',
  '.............s.kkkk.s...........',
  '...........kkkkkkkkkkk..........',
  '.........krrrrrrrrrrrrrk........',
  '........krrllrrrrrrrrrrrk.......',
  '.....a..krrllrrrrrrrrrrrk..a....',
  '....aa..krrrrrrrrrrrrrrrk..aa...',
  '...aaa..krrwwwrrrrrrwwwrk..aaa..',
  '....aa..krrwbwrrrrrrwbwrk..aa...',
  '.....a..krrwwwrrrrrrwwwrk..a....',
  '........krrrrrrrrrrrrrrrk.......',
  '........krrrrraarrarrrrrk.......',
  '........krrrrrrrrrrrrrrrk.......',
  '........krrcccccccccccrrk.......',
  '........krccccccccccccrrk.......',
  '........krccccccccccccrrk.......',
  '.........krccccccccccrrk........',
  '.........krrcccccccccrrk........',
  '..........krroooooorrk..........',
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
  '................................',
]

export const lightChildPixel: PixelSpriteData = { grid, palette: paletteFor('Light') }

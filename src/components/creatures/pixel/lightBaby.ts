import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Light 幼年期（stage 1 / Baby）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 2頭身・ほぼ球の丸い幼体（最大横幅16px）。頭上に小さな光輪・大きな優しい目・淡色のお腹を持つ淡黄〜白の神聖な聖獣の赤ちゃん。
 * 色は paletteFor('Light')（k/o/d/r/l/c/w/b ＋ 光アクセント a 白輝 / s 金光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '...........ssssssss.............',
  '..........s........s............',
  '...........s.kkkk.s.............',
  '............kkkkkk..............',
  '..........kkkkkkkkkk............',
  '.........krrrrrrrrrrk...........',
  '........krrllrrrrrrrrk..........',
  '........krrllrrrrrrrrk..........',
  '........krrrrrrrrrrrrk..........',
  '........krwwwrrrrwwwrk..........',
  '........krwbwrrrrwbwrk..........',
  '........krwwwrrrrwwwrk..........',
  '........krrrraarrrrrrk..........',
  '........krrrrrrrrrrrrk..........',
  '........krrccccccccrrk..........',
  '........krcccccccccrrk..........',
  '.........krcccccccrrk...........',
  '.........krcccccccrrk...........',
  '.........krrcccccrrrk...........',
  '..........krrcccrrrk............',
  '..........krrooooork............',
  '...........kooooork.............',
  '..........krrk..krrk............',
  '.........krrrk..krrrk...........',
  '.........koook..koook...........',
  '.........kkkkk..kkkkk...........',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const lightBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Light') }

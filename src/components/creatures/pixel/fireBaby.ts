import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Fire 幼年期（stage 1 / Baby）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 2頭身・ほぼ球の丸い幼体（最大横幅16px）。頭の小さな炎・大きな目・クリーム色のお腹を持つ炎の獣の赤ちゃん。
 * 色は paletteFor('Fire')（k/o/d/r/l/c/w/b ＋ 炎アクセント y/g）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '...............y................',
  '..............ygy...............',
  '.............ygggy..............',
  '............yggggggy............',
  '...........kkkkkkkkkk...........',
  '..........krrrrrrrrrrk..........',
  '.........krrrlllrrrrrrk.........',
  '........krrrlllrrrrrrrrk........',
  '........krrrrrrrrrrrrrrk........',
  '........krwwwrrrrrrwwwrk........',
  '........krwbwrrrrrrwbwrk........',
  '........krwwwrrrrrrwwwrk........',
  '........krrrrrrrrrrrrrrk........',
  '........krrrrrkkkkrrrrrk........',
  '........krrrrrwwwwrrrrrk........',
  '........krrcccccccccrrrk........',
  '.........krcccccccccrrk.........',
  '.........krcccccccccrrk.........',
  '.........krrcccccccrrrk.........',
  '..........krrcccccrrrk..........',
  '..........krrrooooorrk..........',
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

export const fireBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Fire') }

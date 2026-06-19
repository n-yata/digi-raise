import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Plant 幼年期（stage 1 / Baby）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 2頭身・ほぼ球の丸い幼体（最大横幅16px）。頭の双葉の芽・大きな穏やかな目・淡色のお腹を持つ植物の獣の赤ちゃん。
 * 色は paletteFor('Plant')（k/o/d/r/l/c/w/b ＋ 葉アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '..............s.................',
  '.............asa................',
  '............aaaaa...............',
  '...........a.aaa.a..............',
  '...........kkkkkkkkkk...........',
  '.........krrrrrrrrrrrrrrk.......',
  '........krrlllrrrrrrrrrrrk......',
  '.......krrrlllrrrrrrrrrrrrk.....',
  '.......krrrrrrrrrrrrrrrrrrk.....',
  '.......krrwwwrrrrrrwwwrrrrk.....',
  '.......krrwbwrrrrrrwbwrrrrk.....',
  '.......krrwwwrrrrrrwwwrrrrk.....',
  '.......krrrrrrrrrrrrrrrrrrk.....',
  '.......krrrrrrrrrrrrrrrrrrk.....',
  '.......krrrccccccccccrrrrrk.....',
  '.......krrcccccccccccrrrrk......',
  '........krrcccccccccccrrk.......',
  '........krrcccccccccccrrk.......',
  '.........krrccccccccccrrk.......',
  '.........krrrccccccccrrrk.......',
  '..........krrroooooorrrk........',
  '...........kroooooooork.........',
  '...........krrk....krrk.........',
  '..........krrrk....krrrk........',
  '..........koook....koook........',
  '..........kkkkk....kkkkk........',
  '................................',
  '................................',
  '................................',
  '................................',
]

export const plantBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Plant') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Plant 成長期（stage 3 / Adult）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準（プロト fireAdult 準拠）。
 * 3頭身・二足の獣（最大横幅18px）。頭の大きな葉冠と花・穏やかな目・淡色のお腹・葉のしっぽを持つ緑の植物の獣。
 * 色は paletteFor('Plant')（k/o/d/r/l/c/w/b ＋ 葉アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...........a...s...a............',
  '..........aaa.asa.aaa...........',
  '.........aaaaaaaaaaaaa..........',
  '........aaarrrrrrrraaa..........',
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
  '........krrrrccccccrrrrk.a......',
  '........krrrccccccccrrrkaaa.....',
  '........krrrccccccccrrrkaaaa....',
  '........krrrccccccccrrrk.aaa....',
  '.........krrccccccccrrk..aa.....',
  '.........krrccccccccrrk.a.......',
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

export const plantAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Plant') }

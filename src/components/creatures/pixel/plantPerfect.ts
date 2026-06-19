import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Plant 完全体（stage 4 / Perfect）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 3.5頭身・大型化した二足の獣（最大横幅22px）。頭の豪華な大輪の花・左右に広がる葉翼・穏やかな目・淡色のお腹を持つ緑の植物の獣。
 * 色は paletteFor('Plant')（k/o/d/r/l/c/w/b ＋ 葉アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '..........a...s...a.............',
  '.........aaa.asasa.aaa..........',
  '........aaaaasssssaaaaa.........',
  '.......aaaaassssssaaaaaa........',
  '.......aaarrrrrrrrrrraaa........',
  '.......kkkkkkkkkkkkkkkkkk.......',
  'a....krrrrrrrrrrrrrrrrrrrrk....a',
  'aa..krrlllrrrrrrrrrrrrddrrrk..aa',
  'aaakrrrlllrrrrrrrrrrrrddrrrkaaaa',
  '.aakrrrrrrrrrrrrrrrrrrrrrrrkaa..',
  '...krrwwwrrrrrrrrrrrrwwwrrrk....',
  '...krrwbwrrrrrrrrrrrrwbwrrrk....',
  '...krrwwwrrrrrrrrrrrrwwwrrrk....',
  '...krrrrrrrrrrrrrrrrrrrrrrrk....',
  '...krrrrrrrrkkkkkkrrrrrrrrrk....',
  '....krrrrrrrwwwwwwrrrrrrrrk.....',
  '....krrrrccccccccccccrrrrk......',
  '....krrrcccccccccccccrrrrk.a....',
  '....krrrcccccccccccccrrrkaaa....',
  '....krrrcccccccccccccrrrkaaaa...',
  '.....krrcccccccccccccrrk.aaa....',
  '.....krrrcccccccccccrrrk.aa.....',
  '......krroooooooooorrk..........',
  '......krrrooooooorrrrk..........',
  '......krrrk......krrrk..........',
  '.....krrrrk......krrrrk.........',
  '.....krrook......koorrk.........',
  '.....kooook......koooork........',
  '.....kkkkkk......kkkkkk.........',
  '................................',
  '................................',
  '................................',
]

export const plantPerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Plant') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Fire 完全体（stage 4 / Perfect）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 3.5頭身・大型化（最大横幅22px）。頭の角・両肩から立ち上る豪華な炎・鋭い吊り目を持つ赤橙の炎の獣。
 * 色は paletteFor('Fire')（k/o/d/r/l/c/w/b ＋ 炎アクセント y/g）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '.....y.......yyy.......y........',
  '....ygy.....yygyy.....ygy.......',
  '...ygggy...yggggggy..ygggy......',
  '...ygggyg.yggggggggy.gggggy.....',
  '....gggggggrrrrrrrrgggggg.......',
  '......kkkkkkkkkkkkkkkkkk........',
  '.....krrrrrrrrrrrrrrrrrrk.......',
  '....krrrlllrrrrrrrrrrrrrrk......',
  '...krrrrlllrrrrrrrrrrddrrrk.....',
  '...krrrrrrrrrrrrrrrrrrrrrrk.....',
  '..krrrrrrrrrrrrrrrrrrrrrrrrk....',
  '..krrwwwwrrrrrrrrrrrrwwwwrrk....',
  '..krrwbbwrrrrrrrrrrrrwbbwrrk....',
  '..krrwwwwrrrrrrrrrrrrwwwwrrk....',
  '..krrrrrrrrrrrrrrrrrrrrrrrrk....',
  '..krrrrrrrrkkkkkkkkrrrrrrrrk....',
  '..krrrrrrrrwwwwwwwwrrrrrrrrk....',
  '...krrrcccccccccccccccrrrrk.....',
  '...krrccccccccccccccccccrrk.....',
  '...krrccccccccccccccccccrrk.....',
  '...krrccccccccccccccccccrrk.....',
  '....krrcccccccccccccccccrk......',
  '....krrrccccccccccccccrrk.......',
  '.....krrrooooooooooorrrk........',
  '.....krrk..........krrk.........',
  '....krrrk..........krrrk........',
  '....krrok..........korrk........',
  '...krrrok..........korrrk.......',
  '...kooook..........koooork......',
  '...kkkkkk..........kkkkkkk......',
  '................................',
  '................................',
]

export const firePerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Fire') }

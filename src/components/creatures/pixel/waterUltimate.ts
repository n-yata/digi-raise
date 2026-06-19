import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Water 究極体（stage 5）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準（最大・26px幅）。
 * 4頭身・最大。巨大な王冠状の背ビレ・左右の大ヒレ・重厚な体・凛々しい目・淡色のお腹・水しぶきの光背（a 白青 / s 濃青）を持つ。
 * 色は paletteFor('Water')（k/o/d/r/l/c/w/b ＋ 水アクセント a/s）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '.......k....k....k....k.........',
  '......ksk..ksk..ksk..ksk........',
  '.....ksaskaksakaksakaksak.......',
  '....kasaaaaaaaaaaaaaaaaaak......',
  '...kaarrrrrrrrrrrrrrrrrraak.....',
  '.....kkkkkkkkkkkkkkkkkkkk.......',
  '...krrrrrrrrrrrrrrrrrrrrrrk.....',
  '..akrllrrrrrrrrrrrrrrrrddrka....',
  '.sakrrrrrrrrrrrrrrrrrrrrrrkas...',
  '.askrrwwwwwrrrrrrrrwwwwwrrksa...',
  '..krrwwbbwwrrrrrrrrwwbbwwrrk....',
  '..krrwwwwwwrrrrrrrrwwwwwwrrk....',
  '..krrrrrrrrrrrrrrrrrrrrrrrrk....',
  '..krrrrrrrrkkkkkkkkrrrrrrrrk....',
  '..akrrrrrrrwwwwwwrrrrrrrrrka....',
  '.sakrrrrrcccccccccccrrrrrkas....',
  '.askrrrrccccccccccccccrrrksa....',
  '..krrrrcccccccccccccccccrrk.....',
  '..krrrcccccccccccccccccccrk.s...',
  '..krrcccccccccccccccccccccrkas..',
  '..krrcccccccccccccccccccccrkaaa.',
  '..krrrcccccccccccccccccccrk.sas.',
  '...krrrooooooooooooooooorrk.sa..',
  '...kroooooooooooooooooooork.s...',
  '...krrk................krrk.....',
  '..krrrk................krrrk....',
  '..krrk..................krrk....',
  '.krrrk..................krrrk...',
  '.koook..................koook...',
  '.kkkkk..................kkkkk...',
  '................................',
  '................................',
]

export const waterUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Water') }

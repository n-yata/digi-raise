import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Light 完全体（stage 4 / Perfect）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 3.5頭身・大型化（最大横幅22px）。頭上の大きな光輪・左右に広がる白い翼・気高い目・淡色のお腹を持つ淡黄〜白の荘厳な聖獣。
 * 色は paletteFor('Light')（k/o/d/r/l/c/w/b ＋ 光アクセント a 白輝 / s 金光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '..........ssssssssss............',
  '.........s..........s...........',
  '..........s.kkkkkk.s............',
  '.......kkkkkkkkkkkkkkkk.........',
  '......krrrrrrrrrrrrrrrrk........',
  'a.....krrllrrrrrrrrrrddrk.....a.',
  'aa...krrrllrrrrrrrrrrddrrk...aa.',
  'aaa..krrrrrrrrrrrrrrrrrrrk..aaa.',
  'aaaa.krrwwwwrrrrrrrrwwwwrk.aaaa.',
  'aaaaakrrwbbwrrrrrrrrwbbwrkaaaaa.',
  'aaaa.krrwwwwrrrrrrrrwwwwrk.aaaa.',
  'aaa..krrrrrrrrrrrrrrrrrrrk..aaa.',
  'aa...krrrrrraarraarrrrrrrk...aa.',
  'a....krrrrrrrrrrrrrrrrrrrk....a.',
  '.....krrccccccccccccccccrk......',
  '.....krccccccccccccccccccrk.....',
  '....krrcccccccccccccccccccrk....',
  '....krccccccccccccccccccccrk....',
  '....krccccccccccccccccccccrk....',
  '.....krcccccccccccccccccccrk....',
  '.....krrcccccccccccccccccrk.....',
  '......krrcccccccccccccccrk......',
  '......krrooooooooooooorrk.......',
  '......krrk..........krrk........',
  '......krrk..........krrk........',
  '.....krrrk..........krrrk.......',
  '.....krrok..........korrk.......',
  '....krrrok..........korrrk......',
  '....kooook..........kooork......',
  '....kkkkkk..........kkkkkk......',
  '................................',
  '................................',
]

export const lightPerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Light') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Light 成長期（stage 3 / Adult）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準（プロト fireAdult 準拠）。
 * 3頭身・二足（最大横幅18px）。頭上の光輪・優しい目・淡色のお腹・背の白い翼を持つ淡黄〜白の神聖な聖獣。
 * 色は paletteFor('Light')（k/o/d/r/l/c/w/b ＋ 光アクセント a 白輝 / s 金光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...........ssssssssss...........',
  '..........s..........s..........',
  '...........s..kkkk..s...........',
  '.........kkkkkkkkkkkkkk.........',
  '........krrrrrrrrrrrrrrk........',
  '.aa.....krrllrrrrrrrrddrk....aa.',
  'aaaa....krrllrrrrrrrrddrk...aaaa',
  '.aaaa..krrrrrrrrrrrrrrrrk..aaaa.',
  '..aaa..krrwwwrrrrrrwwwrrk..aaa..',
  '...aa..krrwbwrrrrrrwbwrrk..aa...',
  '....a..krrwwwrrrrrrwwwrrk..a....',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrraarraarrrrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrcccccccccccccrk.......',
  '.......krccccccccccccccrk.......',
  '.......krccccccccccccccrk.......',
  '.......krccccccccccccccrk.......',
  '........krccccccccccccrk........',
  '........krrcccccccccccrk........',
  '.........krrcccccccccrk.........',
  '.........krroooooooork..........',
  '.........krrk....krrk...........',
  '.........krrk....krrk...........',
  '........krrrk....krrrk..........',
  '........krrok....korrk..........',
  '........koook....koook..........',
  '........kkkkk....kkkkk..........',
  '................................',
  '................................',
  '................................',
]

export const lightAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Light') }

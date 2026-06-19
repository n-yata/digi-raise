import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Light 究極体（stage 5 / Ultimate）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage5 基準。
 * 4頭身・最大（最大横幅26px）。背後に輝く巨大な光背・頭上の二重光輪・大きく広げた白い翼・装甲化した体・気高い目を持つ淡黄〜白の聖獣の最終形態。
 * 色は paletteFor('Light')（k/o/d/r/l/c/w/b ＋ 光アクセント a 白輝 / s 金光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '........sssssssssssssss.........',
  '.......s...............s........',
  's.......s.ssssssssss.s.........s',
  'as......s.s.kkkkkk.s.s........sa',
  'aas....kkkkkkkkkkkkkkkk......saa',
  'aaas..krrrrrrrrrrrrrrrrk....saaa',
  'aaaa..krrllrrrrrrrrrrddrk...aaaa',
  'aaaa.krrrllrrrrrrrrrrddrrk..aaaa',
  'aaaakrrrrrrrrrrrrrrrrrrrrk.aaaaa',
  'aaaakrrwwwwrrrrrrrrrrwwwwrkaaaaa',
  'aaaakrrwbbwrrrrrrrrrrwbbwrkaaaaa',
  'aaaakrrwwwwrrrrrrrrrrwwwwrkaaaaa',
  'aaaakrrrrrrrrrrrrrrrrrrrrk.aaaaa',
  'aaaa.krrrrrraarraarrrrrrk..aaaa.',
  'aaas.krrrrrrrrrrrrrrrrrrk...saaa',
  'aas..krrcccccccccccccccrk....saa',
  'as...krccccccccccccccccrrk....sa',
  's...krrcccccccccccccccccrk.....s',
  '....krccccccccccccccccccrk......',
  '....krccccccccccccccccccrk......',
  '....krrcccccccccccccccccrk......',
  '.....krccccccccccccccccrk.......',
  '.....krrcccccccccccccrrk........',
  '.....krrooooooooooorrrk.........',
  '.....krrk..........krrk.........',
  '....krrrk..........krrrk........',
  '....krrok..........korrk........',
  '...krrrok..........korrrk.......',
  '...kooook..........kooork.......',
  '...kkkkkk..........kkkkkk.......',
  '................................',
  '................................',
]

export const lightUltimatePixel: PixelSpriteData = { grid, palette: paletteFor('Light') }

import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Dark 成熟期（stage 3 / Adult）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準（プロト fireAdult 準拠）。
 * 3頭身・二足（最大横幅18px）。頭の鋭い一対の角・紫炎をまとう体・鋭い吊り目・しっぽの妖光を持つ闇の獣。
 * 色は paletteFor('Dark')（k/o/d/r/l/c/w/b ＋ 闇アクセント a 紫炎 / s 妖光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '.......a................a.......',
  '......aka..............aka......',
  '......aka..............aka......',
  '......akak............kaka......',
  '.......akkkkkkkkkkkkkkkka.......',
  '........krrrrrrrrrrrrrrk........',
  '........krrrrrrrrrrrrrrk........',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krllrrrrrrrrrrddrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krwwwwrrrrrrwwwwrk.......',
  '.......krwbbwrrrrrrwbbwrk.......',
  '.......krrwwwrrrrrrwwwrrk.......',
  '.......krrrrrrrrrrrrrrrrk.......',
  '.......krrrrrrkkkkrrrrrrk.......',
  '........krrrraaaaaarrrrk........',
  '........krrraaaaaaaarrrk.s......',
  '........krrrccccccccrrrksas.....',
  '........krrrccccccccrrrk.s......',
  '.........krrccccccccrrk.........',
  '.........krrccccccccrrk.........',
  '..........krccccccccrk..........',
  '..........kroooooooork..........',
  '..........krrk....krrk..........',
  '.........krrrk....krrrk.........',
  '.........krook....koork.........',
  '.........koook....koook.........',
  '.........kkkkk....kkkkk.........',
  '................................',
  '................................',
  '................................',
]

export const darkAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Dark') }

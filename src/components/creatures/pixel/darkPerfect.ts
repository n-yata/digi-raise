import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Dark 完全体（stage 4 / Perfect）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage4 基準。
 * 3.5頭身・大型（最大横幅22px）。左右に広がる大角・闇のオーラ（紫炎）をまとう装甲化した体・鋭い吊り目を持つ闇の獣の完全体。
 * 色は paletteFor('Dark')（k/o/d/r/l/c/w/b ＋ 闇アクセント a 紫炎 / s 妖光）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '.....a..................a.......',
  '....aka................aka......',
  '...akaka..............akaka.....',
  '....akak....kkkkkk....kaka......',
  '.....akakkkrrrrrrrrkkkaka.......',
  '......kkrrrrrrrrrrrrrrkk........',
  '.....krrrrrrrrrrrrrrrrrrk.......',
  '....krrrrrrrrrrrrrrrrrrrrk......',
  '....krrrlllrrrrrrrrrrddrrk......',
  '...krrrrlllrrrrrrrrrrddrrrk.....',
  '...krrrrrrrrrrrrrrrrrrrrrrk.....',
  '...krrwwwwrrrrrrrrrrwwwwrrk.....',
  '...krwbbbwrrrrrrrrrrwbbbwrk.....',
  '...krrwwwwrrrrrrrrrrwwwwrrk.....',
  '...krrrrrrrrrrrrrrrrrrrrrrk.....',
  '...krrrrrrrrkkkkkkrrrrrrrrk.....',
  '....krrrrrraaaaaaaarrrrrrk......',
  '....krrrraaaaaaaaaaaarrrrk......',
  's...krrrrccccccccccccrrrrk...s..',
  'sas.krrrrccccccccccccrrrrk.sas..',
  's...krrrrccccccccccccrrrrk...s..',
  '....krrrccccccccccccccrrrk......',
  '.....krrooooooooooooorrrk.......',
  '.....krrrk........krrrrk........',
  '....krrrrk........krrrrrk.......',
  '....krrook........koorrrk.......',
  '...krrrook........koorrrrk......',
  '...krooook........koooork.......',
  '...kkkkkk..........kkkkkk.......',
  '................................',
  '................................',
  '................................',
]

export const darkPerfectPixel: PixelSpriteData = { grid, palette: paletteFor('Dark') }

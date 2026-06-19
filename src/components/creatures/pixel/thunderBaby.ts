import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Thunder 幼年期（stage 1）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage1 基準。
 * 丸い黄色の幼体に小さな稲妻トゲと帯電エフェクト（y 白閃 / a 黄電）を持つ電気の獣。
 * 色は paletteFor('Thunder')（k/o/d/r/l/c/w/b ＋ 雷アクセント y/a）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '..............a.................',
  '.............a..................',
  '............aa........a.........',
  '...........aa.k......a..........',
  '...........k.kk....aa...........',
  '...........kllrrkkrra...........',
  '..........kllrrrrrrrkk..........',
  '.........kllrrrrrrrrrrk.........',
  '........klrrrrrrrrrrrrrk........',
  '........klrwwwrrrrwwwrdk........',
  '........klrwbwrrrrwbwrdk........',
  '........klrwwwrrrrwwwrdk........',
  '........klrrrrrrrrrrrrdk........',
  '........klrrrrkkkkrrrrdk........',
  '........klrrrrccccrrrrddk.......',
  '........klrrccccccccrrddk.......',
  '........klrrccccccccrrddk.......',
  '........klrrccccccccrrddk.......',
  '.........klrrccccccrrddk........',
  '..........klrroooorrddk.........',
  '...........kllrrrrddk...........',
  '............kkrddkkk............',
  '............k.dd.k..............',
  '...........kk.dd.kk.............',
  '..........koo...ook.............',
  '..........kkk...kkk.............',
  '...........y......y.............',
  '..........y........y............',
  '................................',
  '................................',
  '................................',
]

export const thunderBabyPixel: PixelSpriteData = { grid, palette: paletteFor('Thunder') }

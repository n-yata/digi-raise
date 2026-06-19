import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Thunder 成長期（stage 2）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage2 基準。
 * 短い四肢が生え、頭の稲妻トゲが鋭くなった黄色い俊敏な幼獣。帯電エフェクト（y 白閃 / a 黄電）。
 * 色は paletteFor('Thunder')（k/o/d/r/l/c/w/b ＋ 雷アクセント y/a）に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '...........k........k...........',
  '..........ka........ak..........',
  '.........kaak......kaak.........',
  '........klakk......kkalk........',
  '.......kllakrkkkkkkrkall........',
  '.......kllrrrrrrrrrrrrall.......',
  '......klllrrrrrrrrrrrrrdk.......',
  '......klrrrrrrrrrrrrrrrrdk......',
  '......klrwwwrrrrrrrrwwwrdk......',
  '......klrwbwrrrrrrrrwbwrdk......',
  '......klrwwwrrrrrrrrwwwrdk......',
  '......klrrrrrrrrrrrrrrrrdk......',
  '......klrrrrrrkkkkrrrrrrdk......',
  '.......klrrrrrwwwwrrrrrddk......',
  '.......klrrrcccccccccrrddk......',
  '.......klrrcccccccccccrddk......',
  '........klrcccccccccccrddk......',
  '........klrrcccccccccrrddk......',
  '.........klrrcccccccrrddk.......',
  '.........klrroooooorrddk........',
  '.........klrrk....krrddk........',
  '.........kdrk......kdrdk........',
  '........akrdk......kdrka........',
  '.......aakddk......kddkaa.......',
  '......aakooo........oookaa......',
  '......akkkk..........kkkka......',
  '......a..................a......',
  '.....y....................y.....',
  '....y......................y....',
  '................................',
  '................................',
]

export const thunderChildPixel: PixelSpriteData = { grid, palette: paletteFor('Thunder') }

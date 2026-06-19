import type { PixelSpriteData } from './PixelSprite'
import { paletteFor } from './palette'

/**
 * Thunder 成熟期（stage 3）の 32×32 ドット絵。基準シルエット（design.md §3.3）の stage3 基準。
 * 二足の電気獣。頭の稲妻ツノ・鋭い目・お腹の淡色・しっぽの稲妻を持つ黄色い俊敏な雷の獣。
 * fireAdult.ts の体構造を雷獣へ翻案。色は paletteFor('Thunder') に集約しハードコーディングしない。
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '.............a....a.............',
  '............aa....aa............',
  '...........aak....kaa...........',
  '..........aakk....kkaa..........',
  '.........kkrrkkkkkkrrkk.........',
  '........krrrrrrrrrrrrrrk........',
  '........klrrrrrrrrrrrrdk........',
  '.......klrrrrrrrrrrrrrrdk.......',
  '.......klrwwwrrrrrrwwwrdk.......',
  '.......klrwbwrrrrrrwbwrdk.......',
  '.......klrwwwrrrrrrwwwrdk.......',
  '.......klrrrrrrrrrrrrrrdk.......',
  '.......klrrrrrkkkkrrrrrdk.......',
  '........klrrrrwwwwrrrrdk........',
  '........klrrccccccccrrdk........',
  '........klrcccccccccrddk.a......',
  '........klrcccccccccrddk.aa.....',
  '........klrcccccccccrddkaaak....',
  '.........klrcccccccrddkaaak.....',
  '.........klrrccccccrddk.aak.....',
  '..........klroooooorddk.ak......',
  '..........klrrk...krrdk.........',
  '..........kdrk....kdrdk.........',
  '.........kkdrk....kdrdkk........',
  '.........klddk....kddlk.........',
  '.........koook....koook.........',
  '.........kkkkk....kkkkk.........',
  '........y...........y...........',
  '.......y.............y..........',
  '................................',
  '................................',
]

export const thunderAdultPixel: PixelSpriteData = { grid, palette: paletteFor('Thunder') }

import type { PixelSpriteData } from './PixelSprite'
import { buildTypePalette } from './palette'

/**
 * 卵（stage 0 / Egg）の 32×32 ドット絵。クリーチャー本体と同じドット絵基盤で描画し、
 * レトロな世界観へ統一する。形状は共通で、色だけベース色（branch カラー）から生成する。
 * 使用キーは共通シェード k/o/d/r/l のみ（アクセント色は使わない）。
 *   k=アウトライン / l=ハイライト(光沢) / r=ベース / d=影 / o=濃影(底・斑点)
 */

// prettier-ignore
const grid: string[] = [
  '................................',
  '................................',
  '................................',
  '.............krrrk..............',
  '............krrrrrk.............',
  '...........klllrrrrk............',
  '..........kllllrrrrrk...........',
  '.........klllllrrrrrrk..........',
  '.........klllllrrrrrrk..........',
  '........kllllllrrrrrrrk.........',
  '........krlllllrrrrrrrk.........',
  '.......krrllllrrrrrdrddk........',
  '.......krrrrrrrrrrrrrddk........',
  '.......krrrrrrrrrrrrrddk........',
  '.......krrrrrrrrrrrrrddk........',
  '......krrrrrrrrrrrrrrrddk.......',
  '......krrrrdrrrrrrrrrrddk.......',
  '......krrrrrrrrrrrrrrrddk.......',
  '......krrrrrrrrrrrrrrrddk.......',
  '......krrrrrrrrrrrdrrrddk.......',
  '.......krrrrrrrrrrrrrddk........',
  '.......krrrrrrrrrrrrrddk........',
  '.......krrrrrrrrrroooook........',
  '........krrrrrrrrrooook.........',
  '........koooooooooooook.........',
  '.........koooooooooook..........',
  '..........koooooooook...........',
  '............koooook.............',
  '................................',
  '................................',
  '................................',
  '................................',
]

/** ベース色（HEX）→ 卵のドット絵データ（形状共通・色だけ差し替え）。 */
export function getEggPixel(color: string): PixelSpriteData {
  return { grid, palette: { ...buildTypePalette(color) } }
}

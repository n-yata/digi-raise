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
  '................................',
  '..............kkkk..............',
  '............krrrrrdk............',
  '...........kllrrrrrdk...........',
  '..........kllllrrrrrdk..........',
  '.........krlllllrrrrrdk.........',
  '.........krlllllrrrrrdk.........',
  '........krrlllllrrrrrrdk........',
  '........krrrlllrrrrrrrdk........',
  '........krrrrlrrrrrrrrdk........',
  '.......krrrrrrrrrrrrrrrdk.......',
  '.......krrrrrrrrrrrrrrrdk.......',
  '.......krrrrrrrrrrorrrrdk.......',
  '.......krrrrrrrrrrrrrrrdk.......',
  '.......krrrrrrrrrrrrrrrdk.......',
  '.......krrrrrrrrrrrrrrrdk.......',
  '.......krrrrdrrrrrrrrrrdk.......',
  '.......krrrrrrrrrrrrrrrdk.......',
  '........krrrrrrrrrrrrrdk........',
  '........krrrrrrrrrrrrrdk........',
  '.........krrrrrrrrrrrdk.........',
  '.........kddddddddddddk.........',
  '..........kddddddddddk..........',
  '...........kooooooook...........',
  '.............kkkkkk.............',
  '................................',
  '................................',
  '................................',
  '................................',
]

/** ベース色（HEX）→ 卵のドット絵データ（形状共通・色だけ差し替え）。 */
export function getEggPixel(color: string): PixelSpriteData {
  return { grid, palette: { ...buildTypePalette(color) } }
}

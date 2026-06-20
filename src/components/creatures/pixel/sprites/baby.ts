import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#aab2c2'

// プティ: 分岐前の幼体。まん丸で大きな目、アホ毛と小さな足の可愛いフォルム。
export const babySprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // アホ毛
    if (x === 15 && y >= 7 && y <= 10) return 'k'
    if (inEll(x, y, 15.5, 7, 1, 1)) return 'l'

    // 顔（大きめの目）
    const eL = drawEye(x, y, 12, 15); if (eL) return eL
    const eR = drawEye(x, y, 19, 15); if (eR) return eR
    const m = drawMouth(x, y, 14, 19, 'small'); if (m) return m

    // 胴体（まん丸）
    if (inEll(x, y, 15.5, 18, 8, 8)) {
      if (ellBorder(x, y, 15.5, 18, 8, 8)) return 'k'
      if (inEll(x, y, 11, 13, 3, 3)) return 'l'
      if (inEll(x, y, 20, 23, 4, 3)) return 'd'
      // ほっぺ
      if (inEll(x, y, 10, 18, 1.4, 1.2) || inEll(x, y, 21, 18, 1.4, 1.2)) return 'l'
      return 'r'
    }

    // 小さな足
    for (const fx of [12, 19] as const) {
      if (inEll(x, y, fx, 26, 2, 1.6)) return ellBorder(x, y, fx, 26, 2, 1.6) ? 'k' : 'r'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 12, y: 15 }, { x: 19, y: 15 }],
    mouth: { x: 14, y: 19 },
  },
}

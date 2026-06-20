import { buildTypePalette } from '../palette'
import { makeGrid, inEll, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#ffe27a' // 灯火の金

// ルーチェ（光）: 小さな灯火の精。ゆらめく炎体に顔、周囲にきらめき、小さな足。
export const childASprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── きらめき（4方向の星）──
    for (const [sx, sy] of [[6, 11], [25, 13], [7, 22], [24, 20]] as const) {
      if ((Math.abs(x - sx) <= 1 && y === sy) || (x === sx && Math.abs(y - sy) <= 1)) return 'l'
    }

    // ── 炎体（下は丸く、上はとがる）──
    const inFlame = inEll(x, y, 15.5, 19, 5.5, 5.5) || inTri(x, y, 15.5, 9, 12, 19, 19)
    if (inFlame) {
      // 顔
      const eL = drawEye(x, y, 13, 18); if (eL) return eL
      const eR = drawEye(x, y, 18, 18); if (eR) return eR
      const m = drawMouth(x, y, 14, 21, 'small'); if (m) return m
      // 縁
      const border =
        !(inEll(x - 1, y, 15.5, 19, 5.5, 5.5) || inTri(x - 1, y, 15.5, 9, 12, 19, 19)) ||
        !(inEll(x + 1, y, 15.5, 19, 5.5, 5.5) || inTri(x + 1, y, 15.5, 9, 12, 19, 19)) ||
        !(inEll(x, y - 1, 15.5, 19, 5.5, 5.5) || inTri(x, y - 1, 15.5, 9, 12, 19, 19)) ||
        !(inEll(x, y + 1, 15.5, 19, 5.5, 5.5) || inTri(x, y + 1, 15.5, 9, 12, 19, 19))
      if (border) return 'k'
      if (inEll(x, y, 15.5, 20, 2.5, 2.8)) return 'l' // 芯の光
      if (inEll(x, y, 18, 22, 2, 2)) return 'd'
      return 'r'
    }

    // ── 小さな足 ──
    for (const fx of [13, 18] as const) {
      if (y >= 24 && y <= 25 && x >= fx - 1 && x <= fx + 1) return 'k'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), l: '#fff6cf' },
  face: {
    eyes: [{ x: 13, y: 18 }, { x: 18, y: 18 }],
    mouth: { x: 14, y: 21 },
  },
}

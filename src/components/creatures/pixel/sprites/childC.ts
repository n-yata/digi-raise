import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#6fc8ef' // 空色

// ゼファ（風）: 小さな風の精。後ろへ流れるヒレと風の渦、すばしこい姿、小さな足。
export const childCSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 風の渦（頭上）──
    if (inEll(x, y, 21, 8, 3, 2) && !inEll(x, y, 21, 8, 1.6, 1)) return 'l'

    // ── 流れるヒレ（左右・後方へ）──
    if (inTri(x, y, 3, 13, 9, 18, 17)) return inTri(x, y + 1, 3, 13, 9, 18, 17) ? 'd' : 'k'
    if (inTri(x, y, 28, 13, 14, 23, 17)) return inTri(x, y + 1, 28, 13, 14, 23, 17) ? 'd' : 'k'

    // ── 顔 ──
    const eL = drawEye(x, y, 13, 16); if (eL) return eL
    const eR = drawEye(x, y, 18, 16); if (eR) return eR
    const m = drawMouth(x, y, 14, 19, 'small'); if (m) return m

    // ── すらりとした体 ──
    if (inEll(x, y, 15.5, 18, 5, 6)) {
      if (ellBorder(x, y, 15.5, 18, 5, 6)) return 'k'
      if (inEll(x, y, 13.5, 15, 2, 2.5)) return 'l'
      if (inEll(x, y, 18, 21, 2, 2)) return 'd'
      return 'r'
    }

    // ── 小さな足 ──
    for (const fx of [13, 18] as const) {
      if (y >= 24 && y <= 25 && x >= fx - 1 && x <= fx + 1) return 'k'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), l: '#eaffff' },
  face: {
    eyes: [{ x: 13, y: 16 }, { x: 18, y: 16 }],
    mouth: { x: 14, y: 19 },
  },
}

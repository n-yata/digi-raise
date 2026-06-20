import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

export const childASprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 7.5, ry = 10

    // 顔
    const eL = drawEye(x, y, 12, 15); if (eL) return eL
    const eR = drawEye(x, y, 19, 15); if (eR) return eR
    const m = drawMouth(x, y, 12, 19, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 10, 13, 3, 4)) return 'l'
      if (inEll(x, y, 22, 25, 4, 3)) return 'd'
      return 'r'
    }

    // 翼の芽（背面）
    if (inEll(x, y, 7, 17, 3, 5.5)) {
      if (ellBorder(x, y, 7, 17, 3, 5.5)) return 'k'
      return 'l'
    }
    if (inEll(x, y, 24, 17, 3, 5.5)) {
      if (ellBorder(x, y, 24, 17, 3, 5.5)) return 'k'
      return 'l'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 12, y: 15 }, { x: 19, y: 15 }],
    mouth: { x: 12, y: 19 },
  },
}

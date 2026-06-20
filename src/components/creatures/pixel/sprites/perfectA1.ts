import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHalo, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

export const perfectA1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 9, ry = 11

    // ハロ（大）
    if (inHalo(x, y, 15.5, 6, 8, 2.5)) return 'l'

    // 顔
    const eL = drawEye(x, y, 11, 13); if (eL) return eL
    const eR = drawEye(x, y, 20, 13); if (eR) return eR
    const m = drawMouth(x, y, 11, 17, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 9, 12, 5, 6)) return 'l'
      if (inEll(x, y, 24, 27, 5, 4)) return 'd'
      return 'r'
    }

    // 大きな翼（背面）
    if (inEll(x, y, 3, 17, 7.5, 12)) {
      if (ellBorder(x, y, 3, 17, 7.5, 12)) return 'k'
      return inEll(x, y, 3, 12, 5, 7) ? 'l' : 'd'
    }
    if (inEll(x, y, 28, 17, 7.5, 12)) {
      if (ellBorder(x, y, 28, 17, 7.5, 12)) return 'k'
      return inEll(x, y, 28, 12, 5, 7) ? 'l' : 'd'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 13 }, { x: 20, y: 13 }],
    mouth: { x: 11, y: 17 },
  },
}

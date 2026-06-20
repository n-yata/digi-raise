import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHalo, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

export const adultA1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 8, ry = 11

    // ハロ（頭上リング）
    if (inHalo(x, y, 15.5, 7, 7, 2)) return 'l'

    // 顔
    const eL = drawEye(x, y, 11, 14); if (eL) return eL
    const eR = drawEye(x, y, 20, 14); if (eR) return eR
    const m = drawMouth(x, y, 11, 18, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 10, 12, 4, 5)) return 'l'
      if (inEll(x, y, 23, 26, 5, 4)) return 'd'
      return 'r'
    }

    // 翼（背面）
    if (inEll(x, y, 5, 18, 5.5, 9)) {
      if (ellBorder(x, y, 5, 18, 5.5, 9)) return 'k'
      return inEll(x, y, 5, 15, 3, 5) ? 'l' : 'd'
    }
    if (inEll(x, y, 26, 18, 5.5, 9)) {
      if (ellBorder(x, y, 26, 18, 5.5, 9)) return 'k'
      return inEll(x, y, 26, 15, 3, 5) ? 'l' : 'd'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 14 }, { x: 20, y: 14 }],
    mouth: { x: 11, y: 18 },
  },
}

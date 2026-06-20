import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9ca3af'

export const babySprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 8, ry = 8

    // 顔
    const eL = drawEye(x, y, 12, 14); if (eL) return eL
    const eR = drawEye(x, y, 19, 14); if (eR) return eR
    const m = drawMouth(x, y, 12, 18, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 11, 13, 3, 3)) return 'l'  // ハイライト
    if (inEll(x, y, 20, 23, 4, 3)) return 'd'   // 影

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 12, y: 14 }, { x: 19, y: 14 }],
    mouth: { x: 12, y: 18 },
  },
}

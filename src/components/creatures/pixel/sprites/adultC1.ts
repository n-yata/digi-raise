import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inRect, rectBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

export const adultC1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 8.5, ry = 11

    // ショルダーガード（前面）
    if (inRect(x, y, 3, 13, 8, 19)) return rectBorder(x, y, 3, 13, 8, 19) ? 'k' : 'd'
    if (inRect(x, y, 23, 13, 28, 19)) return rectBorder(x, y, 23, 13, 28, 19) ? 'k' : 'd'

    // 胸当て（前面）
    if (inRect(x, y, 10, 17, 21, 24)) return rectBorder(x, y, 10, 17, 21, 24) ? 'k' : 'd'

    // 顔
    const eL = drawEye(x, y, 11, 13); if (eL) return eL
    const eR = drawEye(x, y, 20, 13); if (eR) return eR
    const m = drawMouth(x, y, 11, 17, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 10, 11, 4, 5)) return 'l'
    if (inEll(x, y, 23, 26, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 13 }, { x: 20, y: 13 }],
    mouth: { x: 11, y: 17 },
  },
}

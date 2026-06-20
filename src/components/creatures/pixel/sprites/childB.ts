import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

export const childBSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 8, ry = 9

    // 角（前面）
    if (inTri(x, y, 15, 8, 13, 18, 13)) {
      const onBorder =
        !inTri(x - 1, y, 15, 8, 13, 18, 13) || !inTri(x + 1, y, 15, 8, 13, 18, 13) ||
        !inTri(x, y - 1, 15, 8, 13, 18, 13) || !inTri(x, y + 1, 15, 8, 13, 18, 13)
      return onBorder ? 'k' : 'o'
    }

    // 顔
    const eL = drawEye(x, y, 12, 15); if (eL) return eL
    const eR = drawEye(x, y, 19, 15); if (eR) return eR
    const m = drawMouth(x, y, 11, 19, 'fang'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 10, 14, 3, 3)) return 'l'
    if (inEll(x, y, 22, 24, 4, 3)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 12, y: 15 }, { x: 19, y: 15 }],
    mouth: { x: 11, y: 19 },
  },
}

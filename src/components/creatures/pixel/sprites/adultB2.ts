import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

// ヴェノス: スリムで毒蛇的。頭部に背びれ、下部にしっぽ。
export const adultB2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 7.5, ry = 11

    // 背びれ（頭部前面スパイク群）
    if (inTri(x, y, 12, 7, 11, 13, 12)) return 'k'
    if (inTri(x, y, 15, 5, 14, 16, 11)) {
      const nb = !inTri(x-1, y, 15, 5, 14, 16, 11) || !inTri(x+1, y, 15, 5, 14, 16, 11) ||
                 !inTri(x, y-1, 15, 5, 14, 16, 11) || !inTri(x, y+1, 15, 5, 14, 16, 11)
      return nb ? 'k' : 'o'
    }
    if (inTri(x, y, 19, 7, 18, 20, 12)) return 'k'

    // しっぽ（下部、斜め左）
    if (inTri(x, y, 9, 31, 11, 15, 28)) {
      const nb = !inTri(x-1, y, 9, 31, 11, 15, 28) || !inTri(x+1, y, 9, 31, 11, 15, 28) ||
                 !inTri(x, y-1, 9, 31, 11, 15, 28) || !inTri(x, y+1, 9, 31, 11, 15, 28)
      return nb ? 'k' : 'd'
    }

    // 顔
    const eL = drawEye(x, y, 11, 13); if (eL) return eL
    const eR = drawEye(x, y, 20, 13); if (eR) return eR
    const m = drawMouth(x, y, 11, 17, 'fang'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 10, 12, 3, 4)) return 'l'
    if (inEll(x, y, 22, 24, 4, 3)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 13 }, { x: 20, y: 13 }],
    mouth: { x: 11, y: 17 },
  },
}

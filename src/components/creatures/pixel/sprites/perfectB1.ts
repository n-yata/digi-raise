import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHSpike, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

export const perfectB1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 10, ry = 11

    // 頭部の角（前面）
    if (inTri(x, y, 12, 6, 11, 13, 11)) {
      const nb = !inTri(x-1,y,12,6,11,13,11)||!inTri(x+1,y,12,6,11,13,11)||!inTri(x,y-1,12,6,11,13,11)||!inTri(x,y+1,12,6,11,13,11)
      return nb ? 'k' : 'o'
    }
    if (inTri(x, y, 19, 6, 18, 20, 11)) {
      const nb = !inTri(x-1,y,19,6,18,20,11)||!inTri(x+1,y,19,6,18,20,11)||!inTri(x,y-1,19,6,18,20,11)||!inTri(x,y+1,19,6,18,20,11)
      return nb ? 'k' : 'o'
    }

    // 肩スパイク（前面）
    if (inHSpike(x, y, 0, 15, 6, 6)) return x <= 1 || !inHSpike(x - 1, y, 0, 15, 6, 6) ? 'k' : 'o'
    if (inHSpike(x, y, 31, 15, 25, 6)) return x >= 30 || !inHSpike(x + 1, y, 31, 15, 25, 6) ? 'k' : 'o'

    // 顔
    const eL = drawEye(x, y, 10, 13); if (eL) return eL
    const eR = drawEye(x, y, 21, 13); if (eR) return eR
    const m = drawMouth(x, y, 10, 18, 'fang'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 9, 12, 4, 5)) return 'l'
    if (inEll(x, y, 24, 27, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 13 }, { x: 21, y: 13 }],
    mouth: { x: 10, y: 18 },
  },
}

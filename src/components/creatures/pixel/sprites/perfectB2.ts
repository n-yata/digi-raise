import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

// ソルヴァン（終点）: 闇の王。頭部に棘の冠。
export const perfectB2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 9.5, ry = 11

    // 棘の冠（5本、前面）
    const spikes = [
      [10, 6, 9, 11, 12], [12, 4, 11, 13, 11], [15, 3, 14, 17, 10],
      [18, 4, 18, 20, 11], [21, 6, 20, 22, 12],
    ] as const
    for (const [tx, ty, bl, br, by] of spikes) {
      if (inTri(x, y, tx, ty, bl, br, by)) {
        const nb = !inTri(x-1,y,tx,ty,bl,br,by)||!inTri(x+1,y,tx,ty,bl,br,by)||!inTri(x,y-1,tx,ty,bl,br,by)||!inTri(x,y+1,tx,ty,bl,br,by)
        return nb ? 'k' : 'o'
      }
    }

    // 顔
    const eL = drawEye(x, y, 10, 14); if (eL) return eL
    const eR = drawEye(x, y, 21, 14); if (eR) return eR
    const m = drawMouth(x, y, 10, 18, 'fang'); if (m) return m

    // 胴体（どっしり）
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 9, 13, 4, 5)) return 'l'
    if (inEll(x, y, 24, 27, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 14 }, { x: 21, y: 14 }],
    mouth: { x: 10, y: 18 },
  },
}

import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHSpike, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

// カオティア: 混沌の権化。全身スパイク、最凶のシルエット。
export const ultimateBSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 10.5, ry = 12

    // 頭部スパイク群（3本）
    const headSpikes = [
      [11, 4, 10, 12, 10], [15, 2, 14, 17, 9], [20, 4, 19, 21, 10],
    ] as const
    for (const [tx, ty, bl, br, by] of headSpikes) {
      if (inTri(x, y, tx, ty, bl, br, by)) {
        const nb = !inTri(x-1,y,tx,ty,bl,br,by)||!inTri(x+1,y,tx,ty,bl,br,by)||!inTri(x,y-1,tx,ty,bl,br,by)||!inTri(x,y+1,tx,ty,bl,br,by)
        return nb ? 'k' : 'o'
      }
    }

    // 巨大肩スパイク
    if (inHSpike(x, y, 0, 15, 5, 8)) return x <= 1 || !inHSpike(x-1, y, 0, 15, 5, 8) ? 'k' : 'o'
    if (inHSpike(x, y, 31, 15, 26, 8)) return x >= 30 || !inHSpike(x+1, y, 31, 15, 26, 8) ? 'k' : 'o'

    // 下部スパイク（左右）
    if (inHSpike(x, y, 0, 24, 6, 5)) return x <= 1 || !inHSpike(x-1, y, 0, 24, 6, 5) ? 'k' : 'o'
    if (inHSpike(x, y, 31, 24, 25, 5)) return x >= 30 || !inHSpike(x+1, y, 31, 24, 25, 5) ? 'k' : 'o'

    // 顔
    const eL = drawEye(x, y, 10, 12); if (eL) return eL
    const eR = drawEye(x, y, 21, 12); if (eR) return eR
    const m = drawMouth(x, y, 10, 17, 'fang'); if (m) return m

    // 胴体（最大）
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 8, 11, 5, 6)) return 'l'
    if (inEll(x, y, 24, 27, 6, 5)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 12 }, { x: 21, y: 12 }],
    mouth: { x: 10, y: 17 },
  },
}

import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHSpike, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9b59b6'

export const adultB1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 9, ry = 11

    // 肩スパイク（前面）
    if (inHSpike(x, y, 2, 16, 7, 5)) return x === 2 || !inHSpike(x - 1, y, 2, 16, 7, 5) ? 'k' : 'o'
    if (inHSpike(x, y, 29, 16, 24, 5)) return x === 29 || !inHSpike(x + 1, y, 29, 16, 24, 5) ? 'k' : 'o'

    // 顔
    const eL = drawEye(x, y, 11, 14); if (eL) return eL
    const eR = drawEye(x, y, 20, 14); if (eR) return eR
    const m = drawMouth(x, y, 11, 18, 'fang'); if (m) return m

    // 胴体（ずっしり）
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 10, 12, 3, 4)) return 'l'
    if (inEll(x, y, 23, 26, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 14 }, { x: 20, y: 14 }],
    mouth: { x: 11, y: 18 },
  },
}

import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inRect, rectBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

// アイギス: 全身甲冑。複数の装甲板。
export const perfectC1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 9.5, ry = 11

    // 肩鎧（前面）
    if (inRect(x, y, 2, 12, 8, 20)) return rectBorder(x, y, 2, 12, 8, 20) ? 'k' : 'd'
    if (inRect(x, y, 23, 12, 29, 20)) return rectBorder(x, y, 23, 12, 29, 20) ? 'k' : 'd'

    // 胸甲（前面）
    if (inRect(x, y, 9, 16, 22, 25)) return rectBorder(x, y, 9, 16, 22, 25) ? 'k' : 'd'
    // 胸甲の装飾（中央線）
    if (inRect(x, y, 15, 17, 16, 24)) return 'k'

    // 顔
    const eL = drawEye(x, y, 10, 13); if (eL) return eL
    const eR = drawEye(x, y, 21, 13); if (eR) return eR
    const m = drawMouth(x, y, 10, 17, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 9, 11, 5, 6)) return 'l'
    if (inEll(x, y, 24, 27, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 13 }, { x: 21, y: 13 }],
    mouth: { x: 10, y: 17 },
  },
}

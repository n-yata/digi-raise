import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inRect, rectBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

// ネクサス（終点）: 幾何学的なネットワーク体。菱形装甲。
export const perfectC2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 9, ry = 11

    // 菱形外装（4辺に突き出た矩形）
    if (inRect(x, y, 5, 10, 9, 14)) return rectBorder(x, y, 5, 10, 9, 14) ? 'k' : 'd'
    if (inRect(x, y, 22, 10, 26, 14)) return rectBorder(x, y, 22, 10, 26, 14) ? 'k' : 'd'
    if (inRect(x, y, 5, 23, 9, 27)) return rectBorder(x, y, 5, 23, 9, 27) ? 'k' : 'd'
    if (inRect(x, y, 22, 23, 26, 27)) return rectBorder(x, y, 22, 23, 26, 27) ? 'k' : 'd'

    // 中央ライン（縦横）
    if (inRect(x, y, 15, 9, 16, 29)) return 'k'
    if (inRect(x, y, 6, 18, 25, 19)) return 'k'

    // 顔
    const eL = drawEye(x, y, 10, 13); if (eL) return eL
    const eR = drawEye(x, y, 21, 13); if (eR) return eR
    const m = drawMouth(x, y, 10, 17, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 9, 12, 5, 6)) return 'l'
    if (inEll(x, y, 24, 26, 5, 4)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 13 }, { x: 21, y: 13 }],
    mouth: { x: 10, y: 17 },
  },
}

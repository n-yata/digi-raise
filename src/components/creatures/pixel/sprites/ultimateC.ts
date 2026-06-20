import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inRect, rectBorder, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

// エクリプス: 機械の頂点。全身を覆う装甲、圧倒的な存在感。
export const ultimateCSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 10, ry = 12

    // 巨大肩装甲
    if (inRect(x, y, 1, 10, 8, 22)) return rectBorder(x, y, 1, 10, 8, 22) ? 'k' : 'd'
    if (inRect(x, y, 23, 10, 30, 22)) return rectBorder(x, y, 23, 10, 30, 22) ? 'k' : 'd'

    // 腕装甲（肩から伸びる）
    if (inRect(x, y, 1, 22, 6, 28)) return rectBorder(x, y, 1, 22, 6, 28) ? 'k' : 'd'
    if (inRect(x, y, 25, 22, 30, 28)) return rectBorder(x, y, 25, 22, 30, 28) ? 'k' : 'd'

    // 胸甲（中央）
    if (inRect(x, y, 9, 16, 22, 26)) return rectBorder(x, y, 9, 16, 22, 26) ? 'k' : 'd'
    // 胸甲装飾（六角形風）
    if (inRect(x, y, 13, 18, 18, 24)) return rectBorder(x, y, 13, 18, 18, 24) ? 'k' : 'r'

    // 顔
    const eL = drawEye(x, y, 10, 12); if (eL) return eL
    const eR = drawEye(x, y, 21, 12); if (eR) return eR
    const m = drawMouth(x, y, 10, 16, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    if (inEll(x, y, 8, 10, 6, 7)) return 'l'
    if (inEll(x, y, 24, 26, 6, 5)) return 'd'

    return 'r'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 12 }, { x: 21, y: 12 }],
    mouth: { x: 10, y: 16 },
  },
}

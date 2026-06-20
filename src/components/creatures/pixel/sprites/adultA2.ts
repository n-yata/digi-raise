import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHalo, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

// エリアル: より軽やかで広い翼。ハロは細め。
export const adultA2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 7.5, ry = 11

    // ハロ（細め）
    if (inHalo(x, y, 15.5, 6, 6, 1.5)) return 'l'

    // 顔
    const eL = drawEye(x, y, 11, 14); if (eL) return eL
    const eR = drawEye(x, y, 20, 14); if (eR) return eR
    const m = drawMouth(x, y, 11, 18, 'small'); if (m) return m

    // 胴体（ハイライト多め）
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 10, 12, 5, 6)) return 'l'
      if (inEll(x, y, 22, 26, 4, 3)) return 'd'
      return 'r'
    }

    // 翼（より広い）
    if (inEll(x, y, 4, 17, 6.5, 10)) {
      if (ellBorder(x, y, 4, 17, 6.5, 10)) return 'k'
      return inEll(x, y, 4, 13, 4, 6) ? 'l' : 'r'
    }
    if (inEll(x, y, 27, 17, 6.5, 10)) {
      if (ellBorder(x, y, 27, 17, 6.5, 10)) return 'k'
      return inEll(x, y, 27, 13, 4, 6) ? 'l' : 'r'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 14 }, { x: 20, y: 14 }],
    mouth: { x: 11, y: 18 },
  },
}

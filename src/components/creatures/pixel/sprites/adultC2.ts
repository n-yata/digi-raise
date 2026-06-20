import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inRect, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

// ブレイン: 大きな頭部（知性型）、アンテナ付き。
export const adultC2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const headCX = 15.5, headCY = 15, headRX = 9, headRY = 8
    const bodyCX = 15.5, bodyCY = 25, bodyRX = 6, bodyRY = 6

    // アンテナ（前面）
    if (inRect(x, y, 15, 5, 16, 8)) return 'k'
    if (inRect(x, y, 14, 5, 17, 6)) return 'k'  // アンテナ先端

    // 頭部の顔
    const eL = drawEye(x, y, 10, 13); if (eL) return eL
    const eR = drawEye(x, y, 21, 13); if (eR) return eR
    const m = drawMouth(x, y, 11, 17, 'small'); if (m) return m

    // 頭部（大）
    if (ellBorder(x, y, headCX, headCY, headRX, headRY)) return 'k'
    if (inEll(x, y, headCX, headCY, headRX, headRY)) {
      if (inEll(x, y, 9, 10, 4, 4)) return 'l'
      if (inEll(x, y, 22, 20, 4, 3)) return 'd'
      return 'r'
    }

    // 胴体（小）
    if (ellBorder(x, y, bodyCX, bodyCY, bodyRX, bodyRY)) return 'k'
    if (inEll(x, y, bodyCX, bodyCY, bodyRX, bodyRY)) {
      if (inEll(x, y, 12, 22, 3, 3)) return 'l'
      if (inEll(x, y, 20, 28, 3, 3)) return 'd'
      return 'r'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 13 }, { x: 21, y: 13 }],
    mouth: { x: 11, y: 17 },
  },
}

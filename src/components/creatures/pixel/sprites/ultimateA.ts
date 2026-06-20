import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHalo, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

// エンピレア: 天上の最強存在。翼が画面いっぱいに広がる。
export const ultimateASprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 9.5, ry = 12

    // 二重ハロ（大）
    if (inHalo(x, y, 15.5, 4, 10, 3)) return 'l'
    if (inHalo(x, y, 15.5, 4, 7, 2)) return 'l'

    // 顔
    const eL = drawEye(x, y, 10, 12); if (eL) return eL
    const eR = drawEye(x, y, 21, 12); if (eR) return eR
    const m = drawMouth(x, y, 10, 16, 'small'); if (m) return m

    // 胴体
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 8, 10, 6, 7)) return 'l'
      if (inEll(x, y, 24, 27, 5, 4)) return 'd'
      return 'r'
    }

    // 巨大翼（画面端まで広がる）
    if (inEll(x, y, 1, 16, 11, 14)) {
      if (ellBorder(x, y, 1, 16, 11, 14)) return 'k'
      if (inEll(x, y, 1, 10, 8, 9)) return 'l'
      if (inEll(x, y, 1, 22, 7, 7)) return 'd'
      return 'r'
    }
    if (inEll(x, y, 30, 16, 11, 14)) {
      if (ellBorder(x, y, 30, 16, 11, 14)) return 'k'
      if (inEll(x, y, 30, 10, 8, 9)) return 'l'
      if (inEll(x, y, 30, 22, 7, 7)) return 'd'
      return 'r'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 10, y: 12 }, { x: 21, y: 12 }],
    mouth: { x: 10, y: 16 },
  },
}

import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inHalo, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

// ヴェルタ（終点）: 神聖な光に包まれた天上的フォルム。翼が胴体と溶け合う。
export const perfectA2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 18, rx = 9, ry = 11

    // 二重ハロ
    if (inHalo(x, y, 15.5, 5, 9, 2.5)) return 'l'
    if (inHalo(x, y, 15.5, 5, 6.5, 1.5)) return 'l'

    // 顔
    const eL = drawEye(x, y, 11, 13); if (eL) return eL
    const eR = drawEye(x, y, 20, 13); if (eR) return eR
    const m = drawMouth(x, y, 11, 17, 'small'); if (m) return m

    // 胴体（ハイライト広め）
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, cx, cy, rx, ry)) {
      if (inEll(x, y, 9, 11, 6, 7)) return 'l'
      if (inEll(x, y, 23, 25, 5, 4)) return 'd'
      return 'r'
    }

    // 翼（より丸く広がる）
    if (inEll(x, y, 2, 16, 8.5, 13)) {
      if (ellBorder(x, y, 2, 16, 8.5, 13)) return 'k'
      return inEll(x, y, 2, 11, 6, 8) ? 'l' : 'r'
    }
    if (inEll(x, y, 29, 16, 8.5, 13)) {
      if (ellBorder(x, y, 29, 16, 8.5, 13)) return 'k'
      return inEll(x, y, 29, 11, 6, 8) ? 'l' : 'r'
    }

    return '.'
  }),
  palette: buildTypePalette(BASE),
  face: {
    eyes: [{ x: 11, y: 13 }, { x: 20, y: 13 }],
    mouth: { x: 11, y: 17 },
  },
}

import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, drawEye, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

// モルテ（死）: 闇をまとう小さな死霊。とんがり頭巾と双角、緑に光る眼窩、ボロ裾。
const BASE = '#6f3f93'

export const childBSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 19, rx = 7, ry = 9

    // 双角（頭の左右から外へ反る）
    if (inTri(x, y, 8, 6, 10, 13, 13)) return inTri(x - 1, y, 8, 6, 10, 13, 13) && inTri(x, y - 1, 8, 6, 10, 13, 13) ? 'o' : 'k'
    if (inTri(x, y, 23, 6, 18, 13, 21)) return inTri(x + 1, y, 23, 6, 18, 13, 21) && inTri(x, y - 1, 23, 6, 18, 13, 21) ? 'o' : 'k'

    // とんがり頭巾の頂点
    if (inTri(x, y, 15, 6, 11, 14, 13)) return inTri(x, y + 1, 15, 6, 11, 14, 13) ? 'r' : 'k'

    // 緑に光る眼窩（白目の下地、アニメ後も周囲が光る）
    if (inEll(x, y, 12, 15, 2.4, 2.4) || inEll(x, y, 19, 15, 2.4, 2.4)) {
      const eL = drawEye(x, y, 12, 15); if (eL) return eL
      const eR = drawEye(x, y, 19, 15); if (eR) return eR
      return 'g'
    }
    // 牙の口
    const m = drawMouth(x, y, 12, 19, 'fang'); if (m) return m

    // 胴体（闇の衣）
    if (!inEll(x, y, cx, cy, rx, ry)) return '.'
    // ボロ裾（下端をギザギザに刳り抜く）
    if (y >= 25 && (x % 3 === 1)) return '.'
    if (y >= 27) return '.'
    if (ellBorder(x, y, cx, cy, rx, ry)) return 'k'
    if (inEll(x, y, 11, 14, 3, 3)) return 'd'   // 顔まわりは暗く落とす
    if (inEll(x, y, 20, 24, 3.5, 3)) return 'o'
    if (inEll(x, y, 12, 22, 3, 3)) return 'l'
    return 'r'
  }),
  palette: { ...buildTypePalette(BASE), g: '#7CFF7A' },
  face: {
    eyes: [{ x: 12, y: 15 }, { x: 19, y: 15 }],
    mouth: { x: 12, y: 19 },
  },
}

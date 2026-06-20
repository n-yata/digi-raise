import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inRect, rectBorder, inCapsule, capsuleEdge, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#4f86bf' // 鋼青

// アイギス: 大盾の守護者。全身を覆う銀縁の大盾、中央に輝くシアンの紋章、頭と脚がのぞく。
export const perfectC1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 頭（盾の上からのぞく）──
    const eL = drawEye(x, y, 13, 7); if (eL) return eL
    const eR = drawEye(x, y, 18, 7); if (eR) return eR
    if (inEll(x, y, 15.5, 7, 3, 3)) {
      if (ellBorder(x, y, 15.5, 7, 3, 3)) return 'k'
      return y <= 6 ? 's' : 'd'
    }

    // ── 腕（盾の左右を掴む）──
    for (const [ax, ay, hx, hy] of [[8, 14, 11, 18], [23, 14, 20, 18]] as const) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.6)) return capsuleEdge(x, y, ax, ay, hx, hy, 1.6) ? 'k' : 'd'
    }

    // ── 脚（盾の下からのぞく）──
    for (const lx of [13, 18] as const) {
      if (inCapsule(x, y, lx, 26, lx, 30, 1.5)) {
        if (capsuleEdge(x, y, lx, 26, lx, 30, 1.5)) return 'k'
        if (y >= 29) return 's'
        return 'd'
      }
    }

    // ── 大盾（先のとがった紋章盾）──
    const shieldTop = inRect(x, y, 6, 9, 25, 22)
    const shieldTip = Math.abs(x - 15.5) <= (26 - y) * 1.4 && y >= 22 && y <= 27
    if (shieldTop || shieldTip) {
      // 銀の縁取り
      const edge =
        (shieldTop && rectBorder(x, y, 6, 9, 25, 22)) ||
        (shieldTip && (Math.abs(x - 15.5) >= (26 - y) * 1.4 - 1 || y >= 27))
      if (edge) return 's'
      if (x === 15 || x === 16) return 's' // 中央リブ
      // 中央のシアン紋章（菱形）
      if (Math.abs(x - 15.5) + Math.abs(y - 15) <= 3.4) {
        return Math.abs(x - 15.5) + Math.abs(y - 15) <= 1.8 ? 'l' : 'g'
      }
      if (x < 15) return 'r'
      return 'd'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), s: '#cdd9e6', g: '#7df9ff' },
  face: { eyes: [{ x: 13, y: 7 }, { x: 18, y: 7 }] },
}

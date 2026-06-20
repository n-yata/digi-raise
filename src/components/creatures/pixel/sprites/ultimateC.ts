import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inHalo, inRect, rectBorder, inCapsule, capsuleEdge, inTri, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3498db'

// エクリプス: 蝕の機神。人型の機甲騎士。
// エンピレア/カオティアと対の構造 — 日蝕のコロナ環/シアンのバイザー/銀の装甲/刃翼。
export const ultimateCSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 日蝕のコロナ環（頭の背後を囲む光輪）──
    if (inHalo(x, y, 15.5, 10, 8, 8)) return 'G'

    // ── 刃翼（背面・左右の金属翼）──
    for (const [tx, ty, side] of [[1, 4, -1], [30, 4, 1]] as const) {
      const bx = 15.5 + side * 5
      if (inTri(x, y, tx, ty, Math.min(bx, 15.5 + side * 9), Math.max(bx, 15.5 + side * 9), 22)) {
        const edge = inCapsule(x, y, bx, 14, tx, ty, 0.8)
        return edge ? 's' : 'd'
      }
    }

    // ── 兜（ダークシルバーの面）＋シアンのバイザー ──
    if (inEll(x, y, 15.5, 10, 4.4, 4.6)) {
      if (y >= 9 && y <= 11) { // バイザー帯
        const eL = drawEye(x, y, 13, 10); if (eL) return eL
        const eR = drawEye(x, y, 18, 10); if (eR) return eR
        return 'g'
      }
      if (ellBorder(x, y, 15.5, 10, 4.4, 4.6)) return 'k'
      if (y < 9) return 's'        // 額当て（明るい銀）
      return 'd'                    // 顎当て（暗部）
    }

    // ── 肩当て（パウルドロン）──
    for (const [cx, cy] of [[8, 15], [23, 15]] as const) {
      if (inEll(x, y, cx, cy, 3.2, 2.6)) {
        if (ellBorder(x, y, cx, cy, 3.2, 2.6)) return 'k'
        if (inEll(x, y, cx, cy - 0.5, 2, 1.4)) return 's'
        return 'd'
      }
    }

    // ── 籠手の刃（手先）──
    for (const [tx, ty, bl, br, by] of [[7, 27, 7, 9, 23], [24, 27, 22, 24, 23]] as const) {
      if (inTri(x, y, tx, ty, bl, br, by)) return 's'
    }

    // ── 腕（装甲）──
    for (const [ax, ay, hx, hy] of [[9, 17, 8, 24], [22, 17, 23, 24]] as const) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.7)) {
        return capsuleEdge(x, y, ax, ay, hx, hy, 1.7) ? 'k' : (x < 15.5 ? 'r' : 'd')
      }
    }

    // ── 脚（装甲）──
    for (const [ax, ay, hx, hy] of [[13, 24, 13, 30], [18, 24, 18, 30]] as const) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.8)) {
        if (capsuleEdge(x, y, ax, ay, hx, hy, 1.8)) return 'k'
        if (y >= 29) return 's'   // 足先（銀）
        return x < 15.5 ? 'r' : 'd'
      }
    }

    // ── 胸甲（コア付き）──
    if (inRect(x, y, 11, 15, 20, 24)) {
      if (rectBorder(x, y, 11, 15, 20, 24)) return 'k'
      if (inEll(x, y, 15.5, 19, 1.6, 2)) return inEll(x, y, 15.5, 19, 0.8, 1.1) ? 'l' : 'g' // コア
      if (x === 13 || x === 18) return 's'
      if (x < 13) return 'l'
      if (x > 18) return 'o'
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#8df6ff', s: '#d0dcea', G: '#ffe39a' },
  face: {
    eyes: [{ x: 13, y: 10 }, { x: 18, y: 10 }],
  },
}

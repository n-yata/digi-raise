import { buildTypePalette } from '../palette'
import { makeGrid, inEll, onEllRing, wingChar, drawEye } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#f6f0ff'

// ヴェルタ（終点）: オファニム。多眼の黄金の輪が幾重にも回る天輪。中心に聖核。
export const perfectA2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 16

    // ── 輪の周囲の小さな羽根（8方向のうち上下左右斜め）──
    for (const [sx, sy, side, span, rise] of [
      [4, 10, -1, 7, 7], [27, 10, 1, 7, 7],
      [5, 22, -1, 6, 6], [26, 22, 1, 6, 6],
    ] as const) {
      const w = wingChar(x, y, sx, sy, side, span, rise)
      if (w) return w
    }

    // ── 多眼の外輪（リング上に複数の眼）──
    const eyePos: Array<[number, number]> = [
      [15.5, 4], [25, 9], [27, 16], [25, 23],
      [15.5, 28], [6, 23], [4, 16], [6, 9],
    ]
    for (const [ex, ey] of eyePos) {
      if (inEll(x, y, ex, ey, 1.6, 1.6)) return inEll(x, y, ex, ey, 0.7, 0.7) ? 'b' : 'w'
    }

    // ── 黄金の三重輪 ──
    if (onEllRing(x, y, cx, cy, 12, 12)) return 'G'
    if (onEllRing(x, y, cx, cy, 8.5, 8.5)) return 'g'
    if (onEllRing(x, y, cx, cy, 5.5, 5.5)) return 'G'

    // ── 中心の聖核（顔つき）──
    const eL = drawEye(x, y, 13, 16); if (eL) return eL
    const eR = drawEye(x, y, 18, 16); if (eR) return eR
    if (inEll(x, y, cx, cy, 3.4, 3.4)) {
      if (inEll(x, y, cx, cy, 1.8, 1.8)) return 'l'
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), G: '#e0a82e', g: '#ffe08a' },
  face: {
    eyes: [{ x: 13, y: 16 }, { x: 18, y: 16 }],
  },
}

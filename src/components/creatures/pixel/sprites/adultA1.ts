import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inHalo, onEllRing, inCapsule, wingChar, drawEye, drawMouth,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#eef0ff'

// セラフィア: 聖なる有翼獣（スフィンクス）。金のたてがみ＋ハロ、前足で座す、背に翼。
export const adultA1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── ハロ ──
    if (inHalo(x, y, 15.5, 5, 4.5, 1.6)) return 'G'

    // ── 金のたてがみ（頭の外周リング）──
    if (onEllRing(x, y, 15.5, 11, 6, 6)) return 'G'

    // ── 顔 ──
    const eL = drawEye(x, y, 13, 11); if (eL) return eL
    const eR = drawEye(x, y, 18, 11); if (eR) return eR
    const m = drawMouth(x, y, 14, 13, 'small'); if (m) return m

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 11, 4, 4)) {
      if (ellBorder(x, y, 15.5, 11, 4, 4)) return 'k'
      if (inEll(x, y, 13.5, 9, 1.6, 1.6)) return 'l'
      return 'r'
    }

    // ── 前足（座した2本）＋金の爪 ──
    for (const lx of [12, 19] as const) {
      if (inCapsule(x, y, lx, 19, lx, 27, 1.6)) {
        if (y >= 26) return 'G' // 足先の金爪
        return inCapsule(x, y, lx, 19, lx, 27, 0.8) ? 'r' : 'k'
      }
    }

    // ── 胴体（伏せた体）──
    if (inEll(x, y, 15.5, 21, 6, 5)) {
      if (ellBorder(x, y, 15.5, 21, 6, 5)) return 'k'
      if (Math.abs(x - 15.5) + Math.abs(y - 20) <= 1.4) return 'G' // 胸の聖石
      if (inEll(x, y, 12.5, 19, 2.5, 2.5)) return 'l'
      if (inEll(x, y, 19, 23, 2.5, 2.5)) return 'd'
      return 'r'
    }

    // ── 背の翼（左右）──
    for (const [sx, sy, side, span, rise] of [
      [12, 16, -1, 13, 13], [19, 16, 1, 13, 13],
    ] as const) {
      const w = wingChar(x, y, sx, sy, side, span, rise)
      if (w) return w
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), G: '#e6b53a' },
  face: {
    eyes: [{ x: 13, y: 11 }, { x: 18, y: 11 }],
    mouth: { x: 14, y: 13 },
  },
}

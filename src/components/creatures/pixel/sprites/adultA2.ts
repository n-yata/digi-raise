import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inTri, inCapsule, wingChar, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#f4612a' // 炎の橙赤

// エリアル: 炎の不死鳥。長い胴と金の鳥脚（鉤爪）、跳ね上げた翼、燃える尾羽。
export const adultA2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 跳ね上げた翼（V字・上方向）──
    for (const [sx, sy, side, span, rise] of [
      [13, 12, -1, 13, 14], [18, 12, 1, 13, 14],
    ] as const) {
      const w = wingChar(x, y, sx, sy, side, span, rise)
      if (w) return w
    }

    // ── 金の冠羽 ──
    if (inTri(x, y, 15.5, 1, 14, 17, 5)) return 'G'
    // ── 金の嘴 ──
    if (inTri(x, y, 15.5, 10, 14, 17, 7)) return 'G'

    // ── 頭部の顔 ──
    const eL = drawEye(x, y, 13, 6); if (eL) return eL
    const eR = drawEye(x, y, 18, 6); if (eR) return eR

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 6, 2.9, 2.9)) {
      if (ellBorder(x, y, 15.5, 6, 2.9, 2.9)) return 'k'
      if (inEll(x, y, 14, 5, 1.1, 1.1)) return 'l'
      return 'r'
    }

    // ── 胴体（短め・縦の鳥の体）──
    if (inEll(x, y, 15.5, 13, 3, 4.6)) {
      if (ellBorder(x, y, 15.5, 13, 3, 4.6)) return 'k'
      if (inEll(x, y, 14.5, 11, 1.3, 1.8)) return 'l'
      if (inEll(x, y, 17, 15, 1.4, 1.8)) return 'd'
      return 'r'
    }

    // ── 金の鳥脚（細く・外側に開く）──
    if (inCapsule(x, y, 14, 16, 12, 25, 0.6)) return 'G'
    if (inCapsule(x, y, 17, 16, 19, 25, 0.6)) return 'G'
    // ── 鉤爪（足先・3本指）──
    for (const fx of [12, 19] as const) {
      if (y === 26 && (x === fx - 2 || x === fx || x === fx + 2)) return 'G'
      if (y === 25 && x >= fx - 1 && x <= fx + 1) return 'G'
    }

    // ── 燃える尾羽（背面・下方に開く）──
    for (const [tx, ty, bl, br, by] of [
      [9, 28, 14, 16, 18], [13, 30, 14, 16, 18],
      [18, 30, 15, 17, 18], [22, 28, 15, 17, 18],
    ] as const) {
      if (inTri(x, y, tx, ty, bl, br, by)) {
        const nb = !inTri(x - 1, y, tx, ty, bl, br, by) || !inTri(x + 1, y, tx, ty, bl, br, by) || !inTri(x, y + 1, tx, ty, bl, br, by)
        if (nb) return 'k'
        return y >= 26 ? 'G' : 'r'
      }
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), G: '#ffd24a', l: '#ffd060' },
  face: {
    eyes: [{ x: 13, y: 6 }, { x: 18, y: 6 }],
  },
}

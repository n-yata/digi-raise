import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inRect, rectBorder, inCapsule, capsuleEdge, wingChar, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#eef2ff'

// アルデア: 装甲の戦乙女（ヴァルキリー）。有翼の兜・銀の鎧・聖槍。エンピレアの聖職者型と対の武人型。
export const perfectA1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 聖槍（右手・上方へ）──
    if (x === 22 && y >= 4 && y <= 22) return 's'
    if (inEll(x, y, 22, 3, 1.2, 2)) return 'G' // 槍の穂先（金）

    // ── 兜の翼飾り（左右）──
    for (const [tx, ty, by] of [[9, 5, 9], [22, 5, 9]] as const) {
      if (inEll(x, y, tx, ty + 2, 2, 2.6) && y >= 5 && y <= by + 1 && (tx < 15.5 ? x < 12 : x > 19)) return 'l'
    }

    // ── 顔（兜のバイザー）──
    const eL = drawEye(x, y, 13, 9); if (eL) return eL
    const eR = drawEye(x, y, 18, 9); if (eR) return eR

    // ── 兜 ──
    if (inEll(x, y, 15.5, 9, 3.4, 3.8)) {
      if (ellBorder(x, y, 15.5, 9, 3.4, 3.8)) return 'k'
      if (y === 9 || y === 10) return 'g' // バイザーの光
      if (y < 9) return 's'
      return 'd'
    }

    // ── 腕（両腕：左下げ・右上げて槍を持つ）──
    if (inCapsule(x, y, 12, 14, 10, 21, 1.5)) return capsuleEdge(x, y, 12, 14, 10, 21, 1.5) ? 'k' : 'r'
    if (inCapsule(x, y, 19, 14, 22, 8, 1.5)) return capsuleEdge(x, y, 19, 14, 22, 8, 1.5) ? 'k' : 'r'

    // ── 胸甲 ──
    if (inRect(x, y, 12, 13, 19, 21)) {
      if (rectBorder(x, y, 12, 13, 19, 21)) return 'k'
      if (Math.abs(x - 15.5) + Math.abs(y - 16) <= 1.3) return 'G' // 胸の聖石
      if (x <= 14) return 's'
      if (x >= 18) return 'o'
      return 'r'
    }

    // ── 腰当て・脚（装甲）──
    for (const lx of [13, 18] as const) {
      if (inCapsule(x, y, lx, 21, lx, 29, 1.6)) {
        if (capsuleEdge(x, y, lx, 21, lx, 29, 1.6)) return 'k'
        if (y >= 28) return 's' // 足先（銀）
        return lx < 15.5 ? 'r' : 'd'
      }
    }

    // ── 背の翼（左右）──
    for (const [sx, sy, side, span, rise] of [
      [12, 13, -1, 14, 14], [19, 13, 1, 14, 14],
    ] as const) {
      const w = wingChar(x, y, sx, sy, side, span, rise)
      if (w) return w
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), s: '#c8d4e6', g: '#bfe9ff', G: '#e6b53a' },
  face: {
    eyes: [{ x: 13, y: 9 }, { x: 18, y: 9 }],
  },
}

import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inHalo, inCapsule, capsuleEdge, wingChar, drawEye, drawMouth,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#e8e8ff'

// エンピレア: 天上の最強存在。人型の熾天使 — 頭・胴・腕・聖衣、背に四枚翼、黄金のハロ。
export const ultimateASprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // 黄金のハロ（頭上の浮遊リング）
    if (inHalo(x, y, 15.5, 3, 5, 2.2)) return 'G'

    // ── 顔（頭部の前面）──
    const eL = drawEye(x, y, 13, 9); if (eL) return eL
    const eR = drawEye(x, y, 18, 9); if (eR) return eR
    const m = drawMouth(x, y, 14, 11, 'small'); if (m) return m

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 9, 3.6, 3.8)) {
      if (ellBorder(x, y, 15.5, 9, 3.6, 3.8)) return 'k'
      if (inEll(x, y, 13.5, 7.5, 1.6, 1.6)) return 'l'
      return 'r'
    }

    // ── 胸の聖石（菱形）──
    if (Math.abs(x - 15.5) + Math.abs(y - 16) <= 1.6) return 'G'

    // ── 胴体（肩から腰へ・逆三角の上半身）──
    if (inEll(x, y, 15.5, 16, 4.6, 4.4)) {
      if (ellBorder(x, y, 15.5, 16, 4.6, 4.4)) return 'k'
      if (inEll(x, y, 13.5, 14, 2, 2)) return 'l'
      if (inEll(x, y, 18, 18, 2.4, 2.2)) return 'd'
      return 'r'
    }

    // ── 腕（肩から手へ、やや広げる）──
    const arms: Array<[number, number, number, number]> = [
      [12, 14, 9, 21],   // 左腕
      [19, 14, 22, 21],  // 右腕
    ]
    for (const [ax, ay, hx, hy] of arms) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.7)) {
        return capsuleEdge(x, y, ax, ay, hx, hy, 1.7) ? 'k' : (x < 15.5 ? 'r' : 'd')
      }
    }

    // ── 聖衣（腰から裾へ広がるローブ）──
    if (y >= 19 && y <= 28) {
      const half = 3 + (y - 19) * 0.95
      if (Math.abs(x - 15.5) <= half) {
        // 裾のスカラップ（波打つ縁）
        if (y >= 27 && ((x % 3) === 1)) return '.'
        const edge = Math.abs(x - 15.5) >= half - 1 || y >= 28
        if (edge) return 'k'
        // 衣のひだ（縦の影）
        if (((x + 1) % 4) === 0) return 'd'
        if (x < 14) return 'l'
        return 'r'
      }
    }

    // ── 四枚翼（背面・左右2対）──
    const wings: Array<[number, number, number, number, number]> = [
      [12, 14, -1, 15, 13],  // 上段（大）
      [12, 19, -1, 11, 9],   // 下段（小）
      [19, 14, +1, 15, 13],
      [19, 19, +1, 11, 9],
    ]
    for (const [sx, sy, side, span, rise] of wings) {
      const w = wingChar(x, y, sx, sy, side, span, rise)
      if (w) return w
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), G: '#e0a82e' },
  face: {
    eyes: [{ x: 13, y: 9 }, { x: 18, y: 9 }],
    mouth: { x: 14, y: 11 },
  },
}

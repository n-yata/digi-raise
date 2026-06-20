import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inTri, inCapsule, capsuleEdge, drawMouth,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#7d2f55' // 暗紅紫

// ソルヴァン（終点）: 闇の王。黄金の棘の王冠、深紅のマント、赤い核を持つ魔王。
export const perfectB2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 深紅のマント（背面・広がる）──
    if (y >= 12 && y <= 30) {
      const half = 5 + (y - 12) * 0.55
      if (Math.abs(x - 15.5) <= half && !inEll(x, y, 15.5, 18, 6, 8)) {
        if (y >= 28 && x % 3 === 1) return '.'
        return Math.abs(x - 15.5) >= half - 1 ? 'k' : 'o'
      }
    }

    // ── 黄金の棘の王冠 ──
    for (const [tx, ty, bl, br, by] of [
      [10, 4, 9, 11, 9], [13, 2, 12, 14, 8], [15.5, 1, 14, 17, 8],
      [18, 2, 17, 19, 8], [21, 4, 20, 22, 9],
    ] as const) {
      if (inTri(x, y, tx, ty, bl, br, by)) return 'G'
    }

    // ── 顔（赤い眼・牙）──
    if (inEll(x, y, 12, 10, 1.6, 1.6)) return inEll(x, y, 12, 10, 0.7, 0.7) ? 'k' : 'g'
    if (inEll(x, y, 19, 10, 1.6, 1.6)) return inEll(x, y, 19, 10, 0.7, 0.7) ? 'k' : 'g'
    const mo = drawMouth(x, y, 12, 13, 'fang'); if (mo) return mo

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 10, 4, 4)) {
      if (ellBorder(x, y, 15.5, 10, 4, 4)) return 'k'
      if (inEll(x, y, 13.5, 8, 1.6, 1.6)) return 'l'
      return 'r'
    }

    // ── 腕 ──
    for (const [ax, ay, hx, hy] of [[11, 15, 9, 23], [20, 15, 22, 23]] as const) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.8)) {
        return capsuleEdge(x, y, ax, ay, hx, hy, 1.8) ? 'k' : (x < 15.5 ? 'r' : 'd')
      }
    }

    // ── 脚 ──
    for (const lx of [13, 18] as const) {
      if (inCapsule(x, y, lx, 23, lx, 30, 1.8)) {
        return capsuleEdge(x, y, lx, 23, lx, 30, 1.8) ? 'k' : (lx < 15.5 ? 'r' : 'd')
      }
    }

    // ── 胴体（赤い核）──
    if (inEll(x, y, 15.5, 17, 5.5, 5.5)) {
      if (ellBorder(x, y, 15.5, 17, 5.5, 5.5)) return 'k'
      if (inEll(x, y, 15.5, 17, 1.5, 1.8)) return inEll(x, y, 15.5, 17, 0.7, 1) ? 'l' : 'g'
      if (inEll(x, y, 12.5, 15, 2, 2)) return 'l'
      if (inEll(x, y, 19, 19, 2.2, 2.2)) return 'd'
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#ff4242', G: '#e6b53a' },
  face: { eyes: [{ x: 12, y: 10 }, { x: 19, y: 10 }], mouth: { x: 12, y: 13 } },
}

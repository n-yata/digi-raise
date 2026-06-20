import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inTri, inCapsule, capsuleEdge, drawEye, drawMouth,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#9d56cf' // 魔人紫

// カオティア: 混沌の権化。人型の魔人。
// エンピレアと対の構造 — 角(↔ハロ)/カオス核(↔聖石)/裂けたローブ(↔聖衣)/蝙蝠翼(↔羽根)。
export const ultimateBSprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 双角（頭頂から後方へ反る・骨色）──
    if (inTri(x, y, 8, 1, 11, 14, 7)) return inTri(x, y + 1, 8, 1, 11, 14, 7) && inTri(x + 1, y, 8, 1, 11, 14, 7) ? 'c' : 'k'
    if (inTri(x, y, 23, 1, 17, 20, 7)) return inTri(x, y + 1, 23, 1, 17, 20, 7) && inTri(x - 1, y, 23, 1, 17, 20, 7) ? 'c' : 'k'

    // ── 顔 ──
    if (inEll(x, y, 15.5, 6, 1, 1)) return inEll(x, y, 15.5, 6, 0.5, 0.5) ? 'b' : 'm' // 第三の眼
    const eL = drawEye(x, y, 12, 10); if (eL) return eL
    const eR = drawEye(x, y, 19, 10); if (eR) return eR
    if (inEll(x, y, 12, 10, 2.3, 2.1) || inEll(x, y, 19, 10, 2.3, 2.1)) return 'g' // 赤い眼光
    const mo = drawMouth(x, y, 12, 13, 'fang'); if (mo) return mo

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 10, 4.2, 4)) {
      if (ellBorder(x, y, 15.5, 10, 4.2, 4)) return 'k'
      if (inEll(x, y, 13, 8, 1.6, 1.6)) return 'l'
      if (inEll(x, y, 18, 12, 1.8, 1.8)) return 'd'
      return 'r'
    }

    // ── 鉤爪（手先・骨色）──
    for (const [tx, ty, bl, br, by] of [
      [7, 25, 7, 9, 22], [9, 26, 9, 11, 22],
      [24, 25, 22, 24, 22], [22, 26, 20, 22, 22],
    ] as const) {
      if (inTri(x, y, tx, ty, bl, br, by)) return 'c'
    }

    // ── 腕（肩→手）──
    for (const [ax, ay, hx, hy] of [[11, 15, 9, 23], [20, 15, 22, 23]] as const) {
      if (inCapsule(x, y, ax, ay, hx, hy, 1.7)) {
        return capsuleEdge(x, y, ax, ay, hx, hy, 1.7) ? 'k' : (x < 15.5 ? 'r' : 'd')
      }
    }

    // ── 胴体（カオス核）──
    if (inEll(x, y, 15.5, 17, 5, 4.8)) {
      if (ellBorder(x, y, 15.5, 17, 5, 4.8)) return 'k'
      if (inEll(x, y, 15.5, 17, 1.4, 1.8)) return inEll(x, y, 15.5, 17, 0.7, 1) ? 'g' : 'm' // 核
      if (inEll(x, y, 12.5, 15, 2, 2)) return 'l'
      if (inEll(x, y, 18.5, 19, 2.4, 2.2)) return 'd'
      return 'r'
    }

    // ── 裂けた闇のローブ（腰→裾・ギザ裾）──
    if (y >= 20 && y <= 29) {
      const half = 3 + (y - 20) * 0.85
      if (Math.abs(x - 15.5) <= half) {
        if (y >= 26 && ((x % 3) === 0)) return '.' // 裂け目
        const edge = Math.abs(x - 15.5) >= half - 1 || y >= 29
        if (edge) return 'k'
        if (((x + 2) % 4) === 0) return 'o'   // ひだの深い影
        if (inEll(x, y, 13, 23, 2.5, 3)) return 'r'
        return 'd'
      }
    }

    // ── 蝙蝠翼（背面・左右の膜）──
    for (const [tipX, tipY, side] of [[1, 8, -1], [30, 8, 1]] as const) {
      const sx = 15.5 + side * 4, sy = 15
      // 肩から翼端へ伸びる三角の膜
      if (inTri(x, y, tipX, tipY, Math.min(sx, 15.5 + side * 11), Math.max(sx, 15.5 + side * 11), 24)) {
        const ribTop = inCapsule(x, y, sx, sy, tipX, tipY, 0.7)
        const ribBot = inCapsule(x, y, sx, sy, 15.5 + side * 11, 24, 0.7)
        if (ribTop || ribBot) return 'k'
        return 'o'
      }
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#ff4242', m: '#e23bff', c: '#f0e2c4' },
  face: {
    eyes: [{ x: 12, y: 10 }, { x: 19, y: 10 }],
    mouth: { x: 12, y: 13 },
  },
}

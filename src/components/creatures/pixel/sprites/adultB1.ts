import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inTri, inCapsule } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#8e44c4' // 妖紫

// グリマス: 嗤う石像鬼（ガーゴイル）。骨の角、巨大な牙の嗤い、赤い眼、蝙蝠翼、ずんぐり脚。
export const adultB1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 骨の角 ──
    if (inTri(x, y, 8, 4, 10, 13, 9)) return inTri(x, y + 1, 8, 4, 10, 13, 9) ? 'c' : 'k'
    if (inTri(x, y, 23, 4, 18, 21, 9)) return inTri(x, y + 1, 23, 4, 18, 21, 9) ? 'c' : 'k'

    // ── 赤く光る眼 ──
    if (inEll(x, y, 12, 12, 1.7, 1.7)) return inEll(x, y, 12, 12, 0.7, 0.7) ? 'k' : 'g'
    if (inEll(x, y, 19, 12, 1.7, 1.7)) return inEll(x, y, 19, 12, 0.7, 0.7) ? 'k' : 'g'

    // ── 巨大な牙の嗤い ──
    if (inEll(x, y, 15.5, 19, 6, 3) && inEll(x, y, 15.5, 14, 7.5, 7)) {
      const border = !inEll(x, y - 1, 15.5, 19, 6, 3) || !inEll(x, y + 1, 15.5, 19, 6, 3)
      if (border) return 'k'
      // かみ合う牙
      if (x % 2 === 0 && y <= 19) return 'w'
      if (x % 2 === 1 && y >= 20) return 'w'
      return 'o'
    }

    // ── 頭＝体（ずんぐり）──
    if (inEll(x, y, 15.5, 14, 7.5, 7)) {
      if (ellBorder(x, y, 15.5, 14, 7.5, 7)) return 'k'
      if (inEll(x, y, 10, 10, 3, 3.5)) return 'l'
      if (inEll(x, y, 21, 17, 3.5, 3)) return 'd'
      return 'r'
    }

    // ── ずんぐり脚＋鉤爪 ──
    for (const lx of [11, 20] as const) {
      if (inCapsule(x, y, lx, 20, lx, 27, 2)) {
        if (y >= 26) return 'c' // 爪
        return inCapsule(x, y, lx, 20, lx, 27, 1.1) ? 'r' : 'k'
      }
    }

    // ── 蝙蝠翼（背面）──
    for (const [tipX, tipY, side] of [[1, 6, -1], [30, 6, 1]] as const) {
      const sx = 15.5 + side * 6, sy = 14
      if (inTri(x, y, tipX, tipY, Math.min(sx, 15.5 + side * 12), Math.max(sx, 15.5 + side * 12), 22)) {
        const rib = inCapsule(x, y, sx, sy, tipX, tipY, 0.7) || inCapsule(x, y, sx, sy, 15.5 + side * 12, 22, 0.7)
        return rib ? 'k' : 'o'
      }
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#ff4242', c: '#f0e2c4' },
  face: { eyes: [{ x: 12, y: 12 }, { x: 19, y: 12 }] },
}

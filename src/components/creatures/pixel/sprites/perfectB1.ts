import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, inCapsule, drawMouth } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#26566b' // 深海の暗碧

// アビシア: 深淵の多眼触手怪。冷たく光る複数の眼、牙の口、垂れ下がる触手。
export const perfectB1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 触手（下方へ放射状に5本）──
    for (const [bx, tx, ty] of [
      [10, 6, 31], [13, 10, 32], [15.5, 15.5, 32], [18, 21, 32], [21, 25, 31],
    ] as const) {
      if (inCapsule(x, y, bx, 18, tx, ty, 1.5)) {
        return inCapsule(x, y, bx, 18, tx, ty, 0.7) ? (y % 3 === 0 ? 'g' : 'd') : 'k'
      }
    }

    // ── 牙の口 ──
    const m = drawMouth(x, y, 13, 16, 'fang'); if (m) return m

    // ── 多眼（大小の光る眼）──
    const eyes: Array<[number, number, number]> = [
      [11, 11, 2], [20, 11, 2], [15.5, 8, 1.6], [9, 16, 1.4], [22, 16, 1.4],
    ]
    for (const [ex, ey, r] of eyes) {
      if (inEll(x, y, ex, ey, r, r)) return inEll(x, y, ex, ey, r * 0.45, r * 0.45) ? 'k' : 'g'
    }

    // ── 暗い肉体 ──
    if (inEll(x, y, 15.5, 14, 8, 7)) {
      if (ellBorder(x, y, 15.5, 14, 8, 7)) return 'k'
      if (inEll(x, y, 10, 10, 3, 3)) return 'l'
      if (inEll(x, y, 21, 18, 3.5, 3)) return 'o'
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#5fe9ff' },
  face: { eyes: [{ x: 11, y: 11 }, { x: 20, y: 11 }], mouth: { x: 13, y: 16 } },
}

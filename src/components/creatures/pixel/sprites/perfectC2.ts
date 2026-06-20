import { buildTypePalette } from '../palette'
import { makeGrid, inCapsule, drawEye } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3f7fd6' // 電脳青

// ネクサス（終点）: 幾何学のネットワーク核。回転する菱形装甲と軌道シャード、中心に輝くシアンの核。
export const perfectC2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const cx = 15.5, cy = 16
    const dia = (ax: number, ay: number, a: number) => Math.abs(x - ax) + Math.abs(y - ay) <= a

    // ── 軌道シャード（四隅の小菱形）──
    for (const [sx, sy] of [[5, 6], [26, 6], [5, 26], [26, 26]] as const) {
      if (dia(sx, sy, 2.2)) return dia(sx, sy, 1) ? 'l' : 'g'
    }

    // ── グリッド線（中心から四隅シャードへ）──
    for (const [sx, sy] of [[5, 6], [26, 6], [5, 26], [26, 26]] as const) {
      if (inCapsule(x, y, cx, cy, sx, sy, 0.45)) return 'g'
    }

    // ── 外装の大菱形（リング）──
    if (dia(cx, cy, 11) && !dia(cx, cy, 9)) return 's'
    if (dia(cx, cy, 8.5) && !dia(cx, cy, 7)) return 'd'

    // ── 中心核（顔つき）──
    const eL = drawEye(x, y, 13, 16); if (eL) return eL
    const eR = drawEye(x, y, 18, 16); if (eR) return eR
    if (dia(cx, cy, 6)) {
      if (dia(cx, cy, 2.4)) return 'g'      // 輝く核
      if (dia(cx, cy, 6) && !dia(cx, cy, 5)) return 'k' // 核の縁
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#7df9ff', s: '#adc4e0' },
  face: { eyes: [{ x: 13, y: 16 }, { x: 18, y: 16 }] },
}

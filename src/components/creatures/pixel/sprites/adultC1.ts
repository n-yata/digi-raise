import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, inRect, rectBorder, inTri, inCapsule, capsuleEdge, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#3f78b8' // 鋼青

// ヴォルト: 電撃の機獣。稲妻のアンテナ、黄色く光るコア、ジグザグの電紋、機械脚。
export const adultC1Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 稲妻のアンテナ（左右）──
    for (const pts of [
      [[10, 3], [12, 6], [10, 7], [12, 10]],
      [[21, 3], [19, 6], [21, 7], [19, 10]],
    ] as const) {
      for (let i = 0; i < pts.length - 1; i++) {
        if (inCapsule(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0.8)) return 'g'
      }
    }

    // ── 顔（シアンのバイザー眼）──
    const eL = drawEye(x, y, 12, 13); if (eL) return eL
    const eR = drawEye(x, y, 19, 13); if (eR) return eR

    // ── 頭部（角張った機械頭）──
    if (inRect(x, y, 11, 10, 20, 16)) {
      if (rectBorder(x, y, 11, 10, 20, 16)) return 'k'
      if (y <= 12) return 'l'
      return 'r'
    }

    // ── 機械脚 ──
    for (const lx of [12, 19] as const) {
      if (inCapsule(x, y, lx, 23, lx, 29, 1.5)) {
        if (capsuleEdge(x, y, lx, 23, lx, 29, 1.5)) return 'k'
        if (y >= 28) return 's'
        return lx < 15.5 ? 'r' : 'd'
      }
    }

    // ── 胴体（電撃コア）──
    if (inRect(x, y, 9, 17, 22, 25)) {
      if (rectBorder(x, y, 9, 17, 22, 25)) return 'k'
      // 黄色いコア
      if (inEll(x, y, 15.5, 21, 2.2, 2.6)) return inEll(x, y, 15.5, 21, 1, 1.3) ? 'l' : 'g'
      // ジグザグの電紋
      if (y === 19 && (x % 2 === 0)) return 'g'
      if (x <= 12) return 'l'
      if (x >= 19) return 'o'
      return 'r'
    }

    // ── 肩のボルト端子 ──
    for (const [cx] of [[8], [23]] as const) {
      if (inEll(x, y, cx, 18, 2.2, 2.2)) return ellBorder(x, y, cx, 18, 2.2, 2.2) ? 'k' : 's'
    }
    // 端子の火花
    if (inTri(x, y, 5, 18, 7, 9, 21)) return 'g'
    if (inTri(x, y, 26, 18, 22, 24, 21)) return 'g'

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#ffe23a', s: '#cdd9e6' },
  face: { eyes: [{ x: 12, y: 13 }, { x: 19, y: 13 }] },
}

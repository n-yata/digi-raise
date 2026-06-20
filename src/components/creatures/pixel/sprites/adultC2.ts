import { buildTypePalette } from '../palette'
import {
  makeGrid, inEll, ellBorder, onEllRing, inRect, rectBorder, inCapsule, drawEye,
} from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#6f86c0' // 灰青（脳）

// ブレイン: 巨大な脳の知性体。しわの寄ったドーム、電撃シアンの眼、感覚触角、小さな機械ボディと脚。
export const adultC2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    const hCX = 15.5, hCY = 12, hRX = 9.5, hRY = 7.5

    // ── 感覚触角（2本・先端シアン）──
    for (const sx of [11, 20] as const) {
      if (inCapsule(x, y, sx, 6, sx, 3, 0.7)) return 'k'
      if (inEll(x, y, sx, 2.5, 1.3, 1.3)) return 'g'
    }

    // ── 脳ドーム ──
    if (inEll(x, y, hCX, hCY, hRX, hRY)) {
      if (ellBorder(x, y, hCX, hCY, hRX, hRY)) return 'k'
      if (Math.abs(x - hCX) < 0.8) return 'o'                 // 中央の溝
      if (onEllRing(x, y, hCX, hCY, 7.5, 6)) return 'd'        // しわ（外輪）
      if (onEllRing(x, y, hCX, hCY, 4, 3.2)) return 'd'        // しわ（内輪）
      if ((x + Math.round(1.4 * Math.sin(y / 1.3))) % 4 === 0) return 'o' // 脳回
      if (inEll(x, y, 10, 9, 2.5, 2.5)) return 'l'
      return 'r'
    }

    // ── 電撃シアンの眼 ──
    if (inEll(x, y, 11, 18, 2.2, 2.2) || inEll(x, y, 20, 18, 2.2, 2.2)) {
      const eL = drawEye(x, y, 11, 18); if (eL) return eL
      const eR = drawEye(x, y, 20, 18); if (eR) return eR
      return 'g'
    }

    // ── 機械ボディ ──
    if (inRect(x, y, 12, 21, 19, 26)) {
      if (rectBorder(x, y, 12, 21, 19, 26)) return 'k'
      if (inEll(x, y, 15.5, 23, 1.6, 1.6)) return 'g' // コア
      return x < 15.5 ? 'r' : 'd'
    }

    // ── 脚 ──
    for (const lx of [13, 18] as const) {
      if (inCapsule(x, y, lx, 26, lx, 30, 1.2)) return inCapsule(x, y, lx, 26, lx, 30, 0.5) ? 'r' : 'k'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#7DF9FF' },
  face: { eyes: [{ x: 11, y: 18 }, { x: 20, y: 18 }] },
}

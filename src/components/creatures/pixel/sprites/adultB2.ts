import { buildTypePalette } from '../palette'
import { makeGrid, inEll, ellBorder, onEllRing, inTri } from '../spriteBuilder'
import type { PixelSpriteData } from '../PixelSprite'

const BASE = '#5e3a86' // 闇紫

// ヴェノス: 鎌首をもたげた猛毒の蛇。広げた毒フード、牙、滴る毒（毒々しい緑）。
export const adultB2Sprite: PixelSpriteData = {
  grid: makeGrid((x, y) => {
    // ── 牙＋滴る毒 ──
    for (const fx of [13, 18] as const) {
      if (inTri(x, y, fx, 21, fx, fx + 1, 17)) return 'c'
    }
    if ((x === 13 && y >= 22 && y <= 24) || (x === 18 && y >= 22 && y <= 25)) return 'g' // 毒の滴
    // 二又の舌
    if (y >= 19 && y <= 22 && x === 15) return 'g'
    if (y === 22 && (x === 14 || x === 16)) return 'g'

    // ── 顔（毒の眼）──
    if (inEll(x, y, 13, 14, 1.6, 1.6)) return inEll(x, y, 13, 14, 0.7, 1) ? 'k' : 'g'
    if (inEll(x, y, 18, 14, 1.6, 1.6)) return inEll(x, y, 18, 14, 0.7, 1) ? 'k' : 'g'

    // ── 頭部 ──
    if (inEll(x, y, 15.5, 14, 4.5, 4)) {
      if (ellBorder(x, y, 15.5, 14, 4.5, 4)) return 'k'
      if (inEll(x, y, 13.5, 12, 1.8, 1.8)) return 'l'
      return 'r'
    }

    // ── 毒フード（頭の背後に広がる）──
    if (inEll(x, y, 15.5, 13, 9.5, 7)) {
      if (ellBorder(x, y, 15.5, 13, 9.5, 7)) return 'k'
      // フードの毒紋（緑のスペクタクル模様）
      if (onEllRing(x, y, 9, 11, 2.5, 2.5) || onEllRing(x, y, 22, 11, 2.5, 2.5)) return 'g'
      if (inEll(x, y, 9, 9, 2.5, 2.5) || inEll(x, y, 22, 22, 2.5, 2.5)) return 'd'
      return 'o'
    }

    // ── 鎌首の胴（とぐろへ向かう）──
    if (inEll(x, y, 15.5, 24, 5.5, 5)) {
      if (ellBorder(x, y, 15.5, 24, 5.5, 5)) return 'k'
      // 腹の鱗（緑の横帯）
      if (y === 23 || y === 26 || y === 29) return 'g'
      if (inEll(x, y, 13, 22, 2, 2)) return 'l'
      return 'r'
    }

    return '.'
  }),
  palette: { ...buildTypePalette(BASE), g: '#7CFF5A', c: '#f0e2c4' },
  face: { eyes: [{ x: 13, y: 14 }, { x: 18, y: 14 }] },
}

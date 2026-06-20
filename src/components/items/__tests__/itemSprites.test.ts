import { describe, it, expect } from 'vitest'
import { FOOD_SPRITES } from '../foodSprites'
import { TOY_SPRITES } from '../toySprites'
import type { ItemSpriteData } from '../ItemSprite'

/**
 * 食べ物・遊び道具のドット絵データが描画前提を満たすことを保証する。
 * ItemSprite は viewBox を grid[0] の列数から算出するため、全行の長さが
 * 揃っていないと viewBox とドット配置がずれる。ここでその不変条件を固定する。
 */
const ALL_ITEMS: Array<[string, ItemSpriteData[]]> = [
  ['FOOD_SPRITES', FOOD_SPRITES],
  ['TOY_SPRITES', TOY_SPRITES],
]

describe('item sprites', () => {
  it('食べ物・遊び道具はそれぞれ 3 種ずつ定義されている', () => {
    expect(FOOD_SPRITES).toHaveLength(3)
    expect(TOY_SPRITES).toHaveLength(3)
  })

  it.each(ALL_ITEMS)('%s: 全スプライトのグリッドが正方形で全行の長さが揃っている', (_name, sprites) => {
    for (const [i, sprite] of sprites.entries()) {
      const rows = sprite.grid.length
      expect(rows, `sprite[${i}] should have rows`).toBeGreaterThan(0)
      const width = sprite.grid[0].length
      // 正方形（16×16 等）であること
      expect(rows, `sprite[${i}] should be square`).toBe(width)
      // 全行が同じ列数であること（viewBox とドット配置のズレ防止）
      for (const [y, row] of sprite.grid.entries()) {
        expect(row.length, `sprite[${i}] row ${y} width`).toBe(width)
      }
    }
  })

  it.each(ALL_ITEMS)('%s: グリッドで使う文字はパレットに定義済みか透明文字(.)である', (_name, sprites) => {
    for (const [i, sprite] of sprites.entries()) {
      for (const row of sprite.grid) {
        for (const ch of row) {
          if (ch === '.') continue
          expect(
            sprite.palette[ch],
            `sprite[${i}] uses '${ch}' which is missing from palette`,
          ).toBeDefined()
        }
      }
      expect(Object.keys(sprite.palette).length).toBeGreaterThan(0)
    }
  })
})

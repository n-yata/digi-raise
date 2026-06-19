import { describe, it, expect } from 'vitest'
import type { CreatureType, EvolutionStage } from '../../../../types/creature'
import { PIXEL_DISPATCH } from '../index'
import { buildTypePalette, hexToHsl, paletteFor } from '../palette'

const PIXEL_TYPES: CreatureType[] = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']
const STAGES: EvolutionStage[] = [1, 2, 3, 4, 5]
const REQUIRED_KEYS = ['k', 'o', 'd', 'r', 'l', 'c', 'w', 'b'] as const
const TRANSPARENT = '.'

/** 登録済み全スプライトを [ラベル, data] で列挙する。 */
function allSprites() {
  const out: Array<{ label: string; data: { grid: string[]; palette: Record<string, string> } }> = []
  for (const type of PIXEL_TYPES) {
    for (const stage of STAGES) {
      const data = PIXEL_DISPATCH[type]?.[stage]
      if (data) out.push({ label: `${type}/${stage}`, data })
    }
  }
  return out
}

describe('pixel sprites integrity', () => {
  // T1: グリッドが厳密に 32×32
  it('T1: 全スプライトの grid が 32 行 × 32 文字である', () => {
    for (const { label, data } of allSprites()) {
      expect(data.grid.length, `${label}: 行数`).toBe(32)
      data.grid.forEach((row, i) => {
        expect(row.length, `${label}: row ${i} の文字数`).toBe(32)
      })
    }
  })

  // T2: 未定義文字の検出（palette キー または透明 '.' のみ）
  it('T2: grid の各文字が palette キーまたは透明文字である', () => {
    for (const { label, data } of allSprites()) {
      const known = new Set([...Object.keys(data.palette), TRANSPARENT])
      data.grid.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x]
          expect(known.has(ch), `${label}: (${x},${y}) の未定義文字 '${ch}'`).toBe(true)
        }
      })
    }
  })

  // T3: 6 タイプ × 5 ステージ = 30 体すべて登録
  it('T3: PIXEL_DISPATCH に 30 体すべて登録されている', () => {
    const missing: string[] = []
    for (const type of PIXEL_TYPES) {
      for (const stage of STAGES) {
        if (!PIXEL_DISPATCH[type]?.[stage]) missing.push(`${type}/${stage}`)
      }
    }
    expect(missing, `未登録: ${missing.join(', ')}`).toEqual([])
    expect(allSprites().length).toBe(30)
  })

  // T4: 各 palette が共通シェードキーを含む
  it('T4: 各 palette が共通キー k/o/d/r/l/c/w/b を含む', () => {
    for (const { label, data } of allSprites()) {
      for (const key of REQUIRED_KEYS) {
        expect(data.palette[key], `${label}: パレットキー '${key}'`).toBeTruthy()
      }
    }
  })
})

describe('buildTypePalette', () => {
  // T5: 生成の決定性 + 明度順序
  it('T5: 決定的な HEX を返し、明度順が o < d < r < l かつ k が最暗', () => {
    const a = buildTypePalette('#ff6b35')
    const b = buildTypePalette('#ff6b35')
    expect(a).toEqual(b) // 決定的

    const L = (hex: string) => hexToHsl(hex)[2]
    expect(L(a.o)).toBeLessThan(L(a.d)) // 濃影 < 影
    expect(L(a.d)).toBeLessThan(L(a.r)) // 影 < ベース
    expect(L(a.r)).toBeLessThan(L(a.l)) // ベース < ハイライト
    expect(L(a.k)).toBeLessThanOrEqual(L(a.o)) // アウトラインが最暗
  })

  it('paletteFor は属性アクセント色を含む（Fire は y/g）', () => {
    const fire = paletteFor('Fire')
    expect(fire.y).toBeTruthy()
    expect(fire.g).toBeTruthy()
    // 共通シェードキーも保持
    expect(fire.r).toBe('#ff6b35')
  })
})

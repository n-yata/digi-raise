import { describe, it, expect } from 'vitest'
import type { CreatureType, EvolutionStage } from '../../../../types/creature'
import { PIXEL_DISPATCH } from '../index'
import { buildTypePalette, hexToHsl, paletteFor } from '../palette'
import { FACE_ANCHORS } from '../faces'
import { buildFaceOverlay } from '../face'

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

describe('face anchors', () => {
  // T6: 30体すべてに顔アンカーがあり、座標が grid 内・目アンカーが瞳('b')に乗る
  it('T6: FACE_ANCHORS が 30体分あり、目アンカーが瞳の近傍に乗る', () => {
    const missing: string[] = []
    for (const type of PIXEL_TYPES) {
      for (const stage of STAGES) {
        const label = `${type}/${stage}`
        const data = PIXEL_DISPATCH[type]?.[stage]
        const face = FACE_ANCHORS[type]?.[stage]
        if (!data) continue
        if (!face) { missing.push(label); continue }

        expect(face.eyes.length, `${label}: 目アンカー数`).toBe(2)
        for (const e of face.eyes) {
          expect(e.x, `${label}: eye.x 範囲`).toBeGreaterThanOrEqual(0)
          expect(e.x).toBeLessThan(32)
          expect(e.y, `${label}: eye.y 範囲`).toBeGreaterThanOrEqual(0)
          expect(e.y).toBeLessThan(32)
          // 目アンカーの 3×3 近傍に瞳 'b' が存在する（アンカーが目に乗っている証拠）
          let hasPupil = false
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const row = data.grid[e.y + dy]
              if (row && row[e.x + dx] === 'b') hasPupil = true
            }
          }
          expect(hasPupil, `${label}: 目アンカー(${e.x},${e.y}) 近傍に瞳 'b' なし`).toBe(true)
        }

        if (face.mouth) {
          expect(face.mouth.x).toBeGreaterThanOrEqual(0)
          expect(face.mouth.x + 3).toBeLessThan(32) // 口は幅4
          expect(face.mouth.y).toBeGreaterThanOrEqual(0)
          expect(face.mouth.y + 1).toBeLessThan(32) // 口は高さ2
        }
      }
    }
    expect(missing, `顔アンカー未設定: ${missing.join(', ')}`).toEqual([])
  })
})

describe('buildFaceOverlay', () => {
  const face = { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } }

  it('attack: 怒り目（眉ライン k）と牙（w）を上書きする', () => {
    const ov = buildFaceOverlay(face, 'attack')
    // 怒り目: 目の中心の1つ上に眉ライン 'k'
    expect(ov.get('11,9')).toBe('k')
    expect(ov.get('20,9')).toBe('k')
    // 牙: 口の下段に 'w'
    expect(ov.get('15,14')).toBe('w')
    expect(ov.get('16,14')).toBe('w')
  })

  it('sleeping: 閉じ目（中央に横ライン k）にする', () => {
    const ov = buildFaceOverlay(face, 'sleeping')
    expect(ov.get('11,10')).toBe('k')
    expect(ov.get('20,10')).toBe('k')
  })

  it('happy: 開いた口（口内 o）にする', () => {
    const ov = buildFaceOverlay(face, 'happy')
    // 口の下段中央が 'o'（暗い口内）
    expect(ov.get('15,14')).toBe('o')
    expect(ov.get('16,14')).toBe('o')
  })
})

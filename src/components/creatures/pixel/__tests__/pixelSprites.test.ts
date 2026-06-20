import { describe, it, expect } from 'vitest'
import { buildTypePalette, hexToHsl } from '../palette'
import { FACE_ANCHORS } from '../faces'
import { getPixelSprite } from '../index'
import { buildFaceOverlay } from '../face'
import type { CreatureId } from '../../../../types/creature'

describe('getPixelSprite', () => {
  it('スプライト未実装のため常に null を返す', () => {
    const ids: CreatureId[] = ['egg', 'baby', 'childA', 'adultA1', 'perfectA1', 'ultimateA']
    for (const id of ids) {
      expect(getPixelSprite(id)).toBeNull()
    }
  })
})

describe('buildTypePalette', () => {
  it('決定的な HEX を返し、明度順が o < d < r < l かつ k が最暗', () => {
    const a = buildTypePalette('#ff6b35')
    const b = buildTypePalette('#ff6b35')
    expect(a).toEqual(b) // 決定的

    const L = (hex: string) => hexToHsl(hex)[2]
    expect(L(a.o)).toBeLessThan(L(a.d)) // 濃影 < 影
    expect(L(a.d)).toBeLessThan(L(a.r)) // 影 < ベース
    expect(L(a.r)).toBeLessThan(L(a.l)) // ベース < ハイライト
    expect(L(a.k)).toBeLessThanOrEqual(L(a.o)) // アウトラインが最暗
  })

  it('共通シェードキー k/o/d/r/l/c/w/b を含む', () => {
    const palette = buildTypePalette('#3498db')
    for (const key of ['k', 'o', 'd', 'r', 'l', 'c', 'w', 'b']) {
      expect(palette[key as keyof typeof palette]).toBeTruthy()
    }
  })
})

describe('FACE_ANCHORS', () => {
  it('スプライト未実装のためエントリが空', () => {
    expect(Object.keys(FACE_ANCHORS).length).toBe(0)
  })
})

describe('buildFaceOverlay', () => {
  const face = { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } }

  it('attack: 怒り目（眉ライン k）と牙（w）を上書きする', () => {
    const ov = buildFaceOverlay(face, 'attack')
    expect(ov.get('11,9')).toBe('k')
    expect(ov.get('20,9')).toBe('k')
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
    expect(ov.get('15,14')).toBe('o')
    expect(ov.get('16,14')).toBe('o')
  })
})

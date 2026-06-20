/**
 * ドット絵の共通シェードキー。全スプライトでこの 8 キーを必ず用意する。
 * k/o/d/r/l はベース色から HSL シフトで自動生成し、c/w/b は全タイプ共通の固定色。
 */
export interface TypePalette {
  [key: string]: string
  k: string // outline（アウトライン）
  o: string // deep shadow（濃影）
  d: string // shadow（影）
  r: string // base
  l: string // highlight（ハイライト）
  c: string // belly（お腹・クリーム）
  w: string // eye white（目・白）
  b: string // pupil（瞳）
}

const SHADE = {
  highlight:  { dh: +10, ds: -6, dl: +11 },
  shadow:     { dsFactor: 0.76, dl: -10 },
  deepShadow: { dsFactor: 0.84, dl: -21 },
  outlineL: 18,
} as const

const BELLY = '#ffd9a8'
const EYE_W = '#ffffff'
const PUPIL = '#2a1a08'

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function clampS(s: number): number {
  return clamp(s, 0, 100)
}

/** '#rrggbb' → [H(0-360), S(0-100), L(0-100)] */
export function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`invalid hex color: ${hex}`)
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 0xff) / 255
  const g = ((int >> 8) & 0xff) / 255
  const b = (int & 0xff) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break
      case g: h = (b - r) / delta + 2; break
      default: h = (r - g) / delta + 4; break
    }
    h *= 60
  }
  return [h, s * 100, l * 100]
}

/** [H(deg), S(0-100), L(0-100)] → '#rrggbb'（範囲外は丸める） */
export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clamp(s, 0, 100) / 100
  const ll = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2

  let r = 0
  let g = 0
  let b = 0
  if (hh < 60)       { r = c; g = x; b = 0 }
  else if (hh < 120) { r = x; g = c; b = 0 }
  else if (hh < 180) { r = 0; g = c; b = x }
  else if (hh < 240) { r = 0; g = x; b = c }
  else if (hh < 300) { r = x; g = 0; b = c }
  else               { r = c; g = 0; b = x }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** base 色（HEX）から 6 シェード + 固定 3 色を生成する純粋関数。 */
export function buildTypePalette(base: string): TypePalette {
  const [h, s, l] = hexToHsl(base)
  return {
    k: hslToHex(h, 100, SHADE.outlineL),
    o: hslToHex(h, clampS(s * SHADE.deepShadow.dsFactor), l + SHADE.deepShadow.dl),
    d: hslToHex(h, clampS(s * SHADE.shadow.dsFactor), l + SHADE.shadow.dl),
    r: base,
    l: hslToHex(h + SHADE.highlight.dh, clampS(s + SHADE.highlight.ds), l + SHADE.highlight.dl),
    c: BELLY,
    w: EYE_W,
    b: PUPIL,
  }
}

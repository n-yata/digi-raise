import type { EvolutionStage } from '../types/creature'

// Pixel-art sprite maps. Each stage shares one silhouette template and is
// recolored per creature type. All rows are 16 characters wide.
//
// Palette chars:
//   '.' transparent   'o' outline (darkest)   'd' dark shade
//   'm' main color     'l' light highlight     'w' white   'k' pupil
export const SPRITE_GRIDS: Record<EvolutionStage, string[]> = {
  // Stage 0 — Egg
  0: [
    '................',
    '......oooo......',
    '....oommmmoo....',
    '...olmmmmmmdo...',
    '..olmmmmmmmmdo..',
    '..olmmdmmmmmdo..',
    '..olmmmmmddmdo..',
    '..olmmmmmmmmdo..',
    '..olmdmmmmmmdo..',
    '...olmmmmmmdo...',
    '....oommmmoo....',
    '......oooo......',
    '................',
    '................',
    '................',
    '................',
  ],
  // Stage 1 — Baby blob
  1: [
    '................',
    '................',
    '......oooo......',
    '....oommmmoo....',
    '...ommmmmmmmo...',
    '...omkmmmmkmo...',
    '...ommmmmmmmo...',
    '...ommmoommmo...',
    '...ommmddmmmo...',
    '....oommmmoo....',
    '......oooo......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // Stage 2 — Child (horns + legs)
  2: [
    '................',
    '....o......o....',
    '....om....mo....',
    '...ommoooommo...',
    '..ommmmmmmmmmo..',
    '..ommkmmmmkmmo..',
    '..ommmmoommmmo..',
    '..ommmmmmmmmmo..',
    '...ommmmmmmmo...',
    '...ommmddmmmo...',
    '...ommmmmmmmo...',
    '....omm..mmo....',
    '....ooo..ooo....',
    '................',
    '................',
    '................',
  ],
  // Stage 3 — Adult (horns + legs + feet)
  3: [
    '................',
    '...o........o...',
    '...om......mo...',
    '..ommoooooommo..',
    '.ommmmmmmmmmmmo.',
    '.ommkmmmmmmkmmo.',
    '.ommmmmoommmmmo.',
    '.ommmmmmmmmmmmo.',
    '.odmmmmmmmmmmdo.',
    '..ommmmmmmmmmo..',
    '..ommmddddmmmo..',
    '..ommmmmmmmmmo..',
    '..ommo....ommo..',
    '..ooo......ooo..',
    '................',
    '................',
  ],
  // Stage 4 — Perfect (wings + horns)
  4: [
    '................',
    '...o........o...',
    '...om......mo...',
    '..ommoooooommo..',
    '.dommmmmmmmmmod.',
    'ddommkmmmmkmmodd',
    '.dommmmoommmmod.',
    '.dommmmmmmmmmod.',
    '..ommmmmmmmmmo..',
    '..ommmddddmmmo..',
    '..ommmmmmmmmmo..',
    '..ommo....ommo..',
    '..ooo......ooo..',
    '................',
    '................',
    '................',
  ],
  // Stage 5 — Ultimate (crown + wings)
  5: [
    '....o.o.o.o.....',
    '....ooooooo.....',
    '..ommoooooommo..',
    '.dommmmmmmmmmod.',
    'ddommkmmmmkmmodd',
    '.dommmmoommmmod.',
    '.dommmmmmmmmmod.',
    '..ommmmmmmmmmo..',
    '..ommmllllmmmo..',
    '..ommmmmmmmmmo..',
    '..ommo....ommo..',
    '..ooo......ooo..',
    '................',
    '................',
    '................',
    '................',
  ],
}

// Pixel size (px) per stage so the creature grows as it evolves.
export const SPRITE_PIXEL_SIZE: Record<EvolutionStage, number> = {
  0: 5,
  1: 5,
  2: 6,
  3: 6,
  4: 7,
  5: 8,
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

const rgb = (r: number, g: number, b: number) =>
  `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`

const darken = ([r, g, b]: [number, number, number], f: number) => rgb(r * f, g * f, b * f)

const lighten = ([r, g, b]: [number, number, number], f: number) =>
  rgb(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f)

// Build a per-pixel color palette derived from the creature's type color.
export function buildPalette(color: string): Record<string, string> {
  const c = hexToRgb(color)
  return {
    '.': 'transparent',
    o: darken(c, 0.32),
    d: darken(c, 0.62),
    m: color,
    l: lighten(c, 0.5),
    w: '#ffffff',
    k: '#16161f',
  }
}

// PWA アイコン生成スクリプト（ドット絵）。
// 32×32 のグリッドを整数倍アップスケールして 192/512 の PNG を生成し、
// favicon 用の SVG も出力する。色はパレットに集約。
//   実行: node scripts/generate-icons.mjs
import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const SIZE = 32 // ベースグリッド（192=×6, 512=×16 の整数倍）

// パレット（マスカブル安全圏に主役を収めるため背景は全面塗り）
const PALETTE = {
  D: '#16213e', // 背景（パネル外）
  P: '#1d2b4d', // 内パネル（中央の発光）
  k: '#5a1700', // アウトライン
  r: '#ff6b35', // 炎ベース
  d: '#d84a1a', // 影
  l: '#ffac6b', // ハイライト
  c: '#ffd9a8', // お腹
  o: '#b83c10', // 濃影
  y: '#ffe06b', // 炎（明）
  g: '#ff9a3c', // 炎（中）
  w: '#ffffff', // 目（白）
  b: '#2a1a08', // 瞳
  s: '#ffd54f', // きらめき
}

// 中央に配置する炎クリーチャー（16幅・'.'=透明）
const CREATURE = [
  '.......yy.......',
  '......ygyg......',
  '.....yggrggy....',
  '....kkkkkkkk....',
  '...krrrrrrrrk...',
  '...krlrrrrdrk...',
  '..krrrrrrrrrrk..',
  '..krwwrrrrwwrk..',
  '..krwbrrrrbwrk..',
  '..krwwrrrrwwrk..',
  '..krrrrrrrrrrk..',
  '..krrrkkkkrrrk..',
  '..krrrwwwwrrrk..',
  '...krrccccrrk...',
  '...krrccccrrk...',
  '...krroooorrk...',
  '...krrk..krrk...',
  '..krrk....krrk..',
  '..kook....kook..',
]
const CW = 16

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// 32×32 のグリッドを文字で組み立てる
function buildGrid() {
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill('D'))
  // 角丸の内パネル P（外周2px・四隅2×2をDで丸める）
  for (let y = 3; y <= 28; y++) {
    for (let x = 3; x <= 28; x++) {
      const corner =
        (x <= 4 && y <= 4) || (x >= 27 && y <= 4) ||
        (x <= 4 && y >= 27) || (x >= 27 && y >= 27)
      if (!corner) g[y][x] = 'P'
    }
  }
  // クリーチャーをスタンプ（中央寄せ）
  const ox = Math.floor((SIZE - CW) / 2) // 8
  const oy = 5
  CREATURE.forEach((row, ry) => {
    if (row.length !== CW) throw new Error(`creature row ${ry} width ${row.length} != ${CW}`)
    for (let rx = 0; rx < CW; rx++) {
      const ch = row[rx]
      if (ch !== '.') g[oy + ry][ox + rx] = ch
    }
  })
  // きらめき（右上に小さな＋）
  for (const [sx, sy] of [[25, 8], [24, 8], [26, 8], [25, 7], [25, 9]]) g[sy][sx] = 's'
  return g
}

function writePng(grid, scale, file) {
  const dim = SIZE * scale
  const png = new PNG({ width: dim, height: dim })
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const ch = grid[Math.floor(y / scale)][Math.floor(x / scale)]
      const [r, gg, bb] = hexToRgb(PALETTE[ch] ?? PALETTE.D)
      const idx = (dim * y + x) << 2
      png.data[idx] = r
      png.data[idx + 1] = gg
      png.data[idx + 2] = bb
      png.data[idx + 3] = 255
    }
  }
  const buf = PNG.sync.write(png)
  writeFileSync(file, buf)
  console.log('wrote', file, `${dim}x${dim}`)
}

function writeSvg(grid, file) {
  const rects = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const ch = grid[y][x]
      if (ch === 'D') continue // 背景は下地の rect でまとめる
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`)
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="512" height="512" shape-rendering="crispEdges">\n` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${PALETTE.D}"/>\n` +
    rects.join('\n') + '\n</svg>\n'
  writeFileSync(file, svg)
  console.log('wrote', file)
}

mkdirSync(OUT_DIR, { recursive: true })
const grid = buildGrid()
writePng(grid, 6, join(OUT_DIR, 'icon-192.png'))
writePng(grid, 16, join(OUT_DIR, 'icon-512.png'))
writeSvg(grid, join(OUT_DIR, 'icon.svg'))
console.log('done')

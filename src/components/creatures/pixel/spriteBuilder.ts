/** 32×32 グリッドを draw 関数から生成 */
export function makeGrid(draw: (x: number, y: number) => string): string[] {
  return Array.from({ length: 32 }, (_, y) =>
    Array.from({ length: 32 }, (_, x) => draw(x, y)).join('')
  )
}

/** 楕円内判定 */
export function inEll(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1
}

/** 楕円境界（内側で隣接ピクセルが1つでも外側） */
export function ellBorder(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  if (!inEll(x, y, cx, cy, rx, ry)) return false
  return !inEll(x - 1, y, cx, cy, rx, ry) || !inEll(x + 1, y, cx, cy, rx, ry) ||
    !inEll(x, y - 1, cx, cy, rx, ry) || !inEll(x, y + 1, cx, cy, rx, ry)
}

/** 矩形内判定 */
export function inRect(x: number, y: number, x1: number, y1: number, x2: number, y2: number): boolean {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2
}

/** 矩形境界 */
export function rectBorder(x: number, y: number, x1: number, y1: number, x2: number, y2: number): boolean {
  return inRect(x, y, x1, y1, x2, y2) && (x === x1 || x === x2 || y === y1 || y === y2)
}

/** 三角形: 頂点 (tx,ty)、底辺 x=bl..br at y=by */
export function inTri(x: number, y: number, tx: number, ty: number, bl: number, br: number, by: number): boolean {
  const ymin = Math.min(ty, by), ymax = Math.max(ty, by)
  if (y < ymin || y > ymax) return false
  const t = (y - ty) / (by - ty)
  const lx = tx + (bl - tx) * t
  const rx = tx + (br - tx) * t
  return x >= Math.min(lx, rx) - 0.4 && x <= Math.max(lx, rx) + 0.4
}

/** 横向きスパイク: 先端 (tipX, cy)、ボディ端 bodyX、半高さ hh */
export function inHSpike(x: number, y: number, tipX: number, cy: number, bodyX: number, hh: number): boolean {
  const dy = Math.abs(y - cy)
  if (dy > hh) return false
  const t = dy / hh
  if (tipX < bodyX) return x >= Math.round(tipX + (bodyX - tipX) * t) && x <= bodyX
  return x >= bodyX && x <= Math.round(tipX - (tipX - bodyX) * t)
}

/** ハロ（薄いリング）: 外楕円 minus 内楕円 */
export function inHalo(x: number, y: number, cx: number, cy: number, rxOuter: number, ryOuter: number): boolean {
  return inEll(x, y, cx, cy, rxOuter, ryOuter) && !inEll(x, y, cx, cy, rxOuter - 2, ryOuter - 0.8)
}

/** 静的な目（3×3、中心に瞳）を描画。該当範囲外は null */
export function drawEye(x: number, y: number, ex: number, ey: number): string | null {
  const dx = x - ex, dy = y - ey
  if (dx < -1 || dx > 1 || dy < -1 || dy > 1) return null
  return dx === 0 && dy === 0 ? 'b' : 'w'
}

/** 静的な口（4×2）を描画。該当範囲外は null */
export function drawMouth(
  x: number, y: number,
  mx: number, my: number,
  variant: 'small' | 'fang' = 'small',
): string | null {
  const dx = x - mx, dy = y - my
  if (dx < 0 || dx > 3 || dy < 0 || dy > 1) return null
  if (variant === 'small') return dy === 1 && (dx === 1 || dx === 2) ? 'k' : null
  // fang: kkkk / rwwr
  if (dy === 0) return 'k'
  return dx === 1 || dx === 2 ? 'w' : null
}

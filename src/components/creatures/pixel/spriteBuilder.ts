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

/** 回転楕円内の正規化距離（0=中心,1=境界）。範囲外は >1。dir は単位ベクトル前提でなくてよい。 */
function rotEllDist(
  x: number, y: number, mx: number, my: number,
  dirX: number, dirY: number, halfLen: number, halfW: number,
): number {
  const len = Math.hypot(dirX, dirY) || 1
  const ux = dirX / len, uy = dirY / len
  const px = x - mx, py = y - my
  const along = px * ux + py * uy
  const perp = -px * uy + py * ux
  return (along / halfLen) ** 2 + (perp / halfW) ** 2
}

/**
 * 羽根（フェザーウィング）を 1 枚描画し、シェードキーを返す（範囲外は null）。
 * 肩 (sx,sy) から扇状に伸びる複数の「羽根（細長い回転楕円）」を重ねて描く。
 * 羽先がとがり、層が重なって本物の翼らしいシルエットになる。
 * side: -1 左 / +1 右、span: 羽根の長さ、rise: 縦の伸び（span に対する高さ比の基準）。
 * 返り値: 'k'（羽先/輪郭）/ 'l'（羽軸ハイライト）/ 'd'（重なりの影）/ 'r'（面）。
 */
export function wingChar(
  x: number, y: number,
  sx: number, sy: number,
  side: number, span: number, rise: number,
): string | null {
  const N = 6
  const hScale = rise / span
  // 内側（下）の羽根を前面に＝小さい i を後で評価して上書き優先するため、外側から走査
  for (let i = N - 1; i >= 0; i--) {
    const t = i / (N - 1)                       // 0:下 .. 1:上
    const ang = (0.04 + 0.80 * t) * (Math.PI / 2)
    const len = span * (0.60 + 0.40 * Math.sin(t * Math.PI)) // 中央が長い
    const tipX = sx + side * Math.cos(ang) * len
    const tipY = sy - Math.sin(ang) * len * hScale
    const mx = (sx + tipX) / 2, my = (sy + tipY) / 2
    const halfLen = Math.hypot(tipX - sx, tipY - sy) / 2 + 0.5
    const halfW = 1.9
    const d = rotEllDist(x, y, mx, my, tipX - sx, tipY - sy, halfLen, halfW)
    if (d < 1) {
      if (d > 0.66) return 'k'                  // 羽根の縁取り
      // 羽軸（中心線）ハイライト：先端寄りは明るく
      const len2 = Math.hypot(tipX - sx, tipY - sy) || 1
      const along = ((x - mx) * (tipX - sx) + (y - my) * (tipY - sy)) / len2
      if (along > halfLen * 0.15) return 'l'
      return i % 2 === 0 ? 'r' : 'd'
    }
  }
  return null
}

/** 線分 (x1,y1)-(x2,y2) を中心とする太さ r のカプセル内判定（腕・脚・尾に使う）。 */
export function inCapsule(
  x: number, y: number, x1: number, y1: number, x2: number, y2: number, r: number,
): boolean {
  const dx = x2 - x1, dy = y2 - y1
  const l2 = dx * dx + dy * dy || 1
  let t = ((x - x1) * dx + (y - y1) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const px = x1 + t * dx, py = y1 + t * dy
  return (x - px) ** 2 + (y - py) ** 2 <= r * r
}

/** カプセルの縁（輪郭）判定: r では内側だが r-1 では外側。 */
export function capsuleEdge(
  x: number, y: number, x1: number, y1: number, x2: number, y2: number, r: number,
): boolean {
  return inCapsule(x, y, x1, y1, x2, y2, r) && !inCapsule(x, y, x1, y1, x2, y2, r - 1.0)
}

/** 楕円フォルド（脳のしわ等）の薄いリング境界判定。 */
export function onEllRing(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
  return d < 1 && d > 0.55
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

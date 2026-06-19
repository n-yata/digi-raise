import type { ReactElement } from 'react'

export interface PixelSpriteData {
  /** 32 行 × 32 文字。各文字は palette のキー。palette に無い文字（'.' 等）は透明。 */
  grid: string[]
  /** 文字 → 塗り色。キーが無い文字は描画しない（透明）。 */
  palette: Record<string, string>
}

interface PixelSpriteProps {
  data: PixelSpriteData
  size: number
}

const GRID = 32

/**
 * 文字グリッド + パレットを 1 セル = 1×1 の <rect> として描画する汎用ドット絵レンダラ。
 * viewBox は 32×32 固定。shapeRendering="crispEdges" でアンチエイリアスを無効化し、
 * 拡大してもドットの輪郭がくっきり保たれる（レトロなドット絵表示）。
 */
export function PixelSprite({ data, size }: PixelSpriteProps) {
  const rects: ReactElement[] = []
  for (let y = 0; y < data.grid.length; y++) {
    const row = data.grid[y]
    for (let x = 0; x < row.length; x++) {
      const fill = data.palette[row[x]]
      if (!fill) continue
      rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
    }
  }
  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  )
}

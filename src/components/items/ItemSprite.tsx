import type { ReactElement } from 'react'

export interface ItemSpriteData {
  /** N 行 × N 文字。各文字は palette のキー。palette に無い文字（'.' 等）は透明。 */
  grid: string[]
  /** 文字 → 塗り色。キーが無い文字は描画しない（透明）。 */
  palette: Record<string, string>
}

interface ItemSpriteProps {
  data: ItemSpriteData
  size: number
}

/**
 * 食べ物・遊び道具など小物アイテムのドット絵レンダラ。
 * クリーチャー本体の PixelSprite と同じ「文字グリッド + パレット」方式だが、
 * viewBox をグリッド寸法から動的に算出するため任意サイズ（16×16 等）に対応する。
 * shapeRendering="crispEdges" でドットの輪郭をくっきり保つ。
 */
export function ItemSprite({ data, size }: ItemSpriteProps) {
  const rows = data.grid.length
  const cols = data.grid[0]?.length ?? 0

  const rects: ReactElement[] = []
  for (let y = 0; y < rows; y++) {
    const row = data.grid[y]
    for (let x = 0; x < row.length; x++) {
      const fill = data.palette[row[x]]
      if (!fill) continue
      rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  )
}

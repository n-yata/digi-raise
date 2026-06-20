import type { ReactElement } from 'react'
import type { AnimState } from '../DefaultCreatureBody'
import { buildFaceOverlay } from './face'
import type { FaceAnchors } from './face'

export interface PixelSpriteData {
  /** 32 行 × 32 文字。各文字は palette のキー。palette に無い文字（'.' 等）は透明。 */
  grid: string[]
  /** 文字 → 塗り色。キーが無い文字は描画しない（透明）。 */
  palette: Record<string, string>
  /** 顔パーツのアンカー。指定すると animState に応じて表情を切り替える（未指定は静止）。 */
  face?: FaceAnchors
}

interface PixelSpriteProps {
  data: PixelSpriteData
  size: number
  animState?: AnimState
}

const GRID = 32

/**
 * 文字グリッド + パレットを 1 セル = 1×1 の <rect> として描画する汎用ドット絵レンダラ。
 * viewBox は 32×32 固定。shapeRendering="crispEdges" でアンチエイリアスを無効化し、
 * 拡大してもドットの輪郭がくっきり保たれる（レトロなドット絵表示）。
 *
 * data.face と animState が揃うと、目・口を上書き描画して表情を切り替える。
 */
export function PixelSprite({ data, size, animState }: PixelSpriteProps) {
  const overlay = data.face && animState ? buildFaceOverlay(data.face, animState) : null

  const rects: ReactElement[] = []
  for (let y = 0; y < data.grid.length; y++) {
    const row = data.grid[y]
    for (let x = 0; x < row.length; x++) {
      const ch = overlay?.get(`${x},${y}`) ?? row[x]
      const fill = data.palette[ch]
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

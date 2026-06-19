import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface FlamePlumeProps {
  x: number
  y: number
  scale: number
  color: string
}

export function FlamePlume({ x, y, scale, color }: FlamePlumeProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M0,-14 C-7,-9 -9,-2 -5,4 C-3,2 -2,-2 -1,0 C0,-4 1,0 2,3 C6,-2 7,-8 0,-14 Z"
        fill={color}
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

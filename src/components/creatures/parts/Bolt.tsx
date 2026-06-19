import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface BoltProps {
  x: number
  y: number
  scale: number
  color: string
}

export function Bolt({ x, y, scale, color }: BoltProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M4,-14 L-4,-2 L2,-2 L-4,12 L6,0 L0,0 L6,-14 Z"
        fill={color}
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

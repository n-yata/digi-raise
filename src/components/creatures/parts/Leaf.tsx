import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface LeafProps {
  x: number
  y: number
  scale: number
  color: string
  angle?: number
}

export function Leaf({ x, y, scale, color, angle = 0 }: LeafProps) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle}) scale(${scale})`}>
      <path
        d="M0,-14 C-8,-8 -8,0 0,6 C8,0 8,-8 0,-14 Z"
        fill={color}
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="-12"
        x2="0"
        y2="4"
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>
  )
}

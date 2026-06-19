import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface WaterFinProps {
  x: number
  y: number
  scale: number
  color: string
  variant?: 'dorsal' | 'side' | 'tail'
}

export function WaterFin({ x, y, scale, color, variant = 'dorsal' }: WaterFinProps) {
  if (variant === 'side') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M0,0 C-10,-4 -14,4 -8,10 C-4,6 0,4 0,0 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (variant === 'tail') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M0,-4 C-8,-10 -12,-4 -8,4 C-4,2 0,0 0,-4 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M0,-4 C8,-10 12,-4 8,4 C4,2 0,0 0,-4 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    )
  }
  // dorsal (default)
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M0,-16 C-6,-10 -8,-2 -4,4 C-2,2 0,-2 2,0 C4,-4 6,-10 0,-16 Z"
        fill={color}
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

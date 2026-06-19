import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface HaloProps {
  x: number
  y: number
  scale: number
  color: string
  variant?: 'ring' | 'wing'
}

export function Halo({ x, y, scale, color, variant = 'ring' }: HaloProps) {
  if (variant === 'wing') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M0,0 C-6,-8 -14,-8 -16,-2 C-12,0 -6,0 0,0 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M0,0 C6,-8 14,-8 16,-2 C12,0 6,0 0,0 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    )
  }
  // ring (default)
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse
        cx="0"
        cy="0"
        rx="10"
        ry="3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      <ellipse
        cx="0"
        cy="0"
        rx="10"
        ry="3"
        fill="none"
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
      />
    </g>
  )
}

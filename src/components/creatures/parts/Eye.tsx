import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface EyeProps {
  x: number
  y: number
  variant?: 'normal' | 'angry' | 'closed'
  scale?: number
}

export function Eye({ x, y, variant = 'normal', scale = 1 }: EyeProps) {
  if (variant === 'closed') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M-4,0 Q0,-2 4,0"
          fill="none"
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (variant === 'angry') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M-5,-4 L4,-1"
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <ellipse cx="0" cy="1" rx="2.5" ry="3" fill={SVG_OUTLINE_COLOR} />
      </g>
    )
  }
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="2.5" ry="3.5" fill={SVG_OUTLINE_COLOR} />
      <circle cx="0.8" cy="-1" r="1" fill="white" />
    </g>
  )
}

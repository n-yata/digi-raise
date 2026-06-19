import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'

interface ShadowVeilProps {
  x: number
  y: number
  scale: number
  color: string
  variant?: 'wisp' | 'veil' | 'cloak'
}

export function ShadowVeil({ x, y, scale, color, variant = 'wisp' }: ShadowVeilProps) {
  if (variant === 'veil') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M-14,0 C-14,-8 -6,-14 0,-14 C6,-14 14,-8 14,0 C10,4 6,8 8,14 C4,10 2,6 0,8 C-2,6 -4,10 -8,14 C-6,8 -10,4 -14,0 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (variant === 'cloak') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path
          d="M-18,0 C-18,-10 -10,-18 0,-18 C10,-18 18,-10 18,0 C14,6 10,12 12,20 C6,14 3,8 0,12 C-3,8 -6,14 -12,20 C-10,12 -14,6 -18,0 Z"
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    )
  }
  // wisp (default)
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M0,-10 C-6,-6 -6,0 0,4 C2,2 2,-2 4,0 C4,-4 6,-8 0,-10 Z"
        fill={color}
        stroke={SVG_OUTLINE_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

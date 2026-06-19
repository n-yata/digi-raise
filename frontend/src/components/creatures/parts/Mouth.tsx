import { SVG_OUTLINE_COLOR } from '../../../data/spriteConfig'
import type { MouthVariant } from '../DefaultCreatureBody'

interface MouthProps {
  x: number
  y: number
  variant?: MouthVariant
  scale?: number
}

export function Mouth({ x, y, variant = 'smile', scale = 1 }: MouthProps) {
  if (variant === 'open') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path d="M-6,0 Q0,8 6,0 Z" fill="#1a1a2e" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M-6,0 Q0,-1 6,0" fill="none" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    )
  }
  if (variant === 'fang') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path d="M-6,0 Q0,5 6,0" fill="none" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="-3,0 -1.5,5 0,0" fill="white" stroke={SVG_OUTLINE_COLOR} strokeWidth="0.8" />
        <polygon points="0,0 1.5,5 3,0" fill="white" stroke={SVG_OUTLINE_COLOR} strokeWidth="0.8" />
      </g>
    )
  }
  if (variant === 'small') {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`}>
        <path d="M-3,0 Q0,3 3,0" fill="none" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    )
  }
  // smile
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M-5,0 Q0,5 5,0" fill="none" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  )
}

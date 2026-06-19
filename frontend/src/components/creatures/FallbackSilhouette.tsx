import type { EvolutionStage } from '../../types/creature'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'
import type { AnimState } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'

interface FallbackSilhouetteProps {
  color: string
  size: number
  stage: EvolutionStage
  animState: AnimState
}

export function FallbackSilhouette({ color, size, stage, animState }: FallbackSilhouetteProps) {
  const isLowStage = stage <= 2
  const ry = isLowStage ? 30 : 36
  const { eye } = getExpression(animState)

  const EyeDot = ({ cx, cy }: { cx: number; cy: number }) => {
    if (eye === 'closed') {
      return <path d={`M${cx - 3},${cy} Q${cx},${cy - 2} ${cx + 3},${cy}`} fill="none" stroke={SVG_OUTLINE_COLOR} strokeWidth="1.5" strokeLinecap="round" />
    }
    return <circle cx={cx} cy={cy} r="3.5" fill={SVG_OUTLINE_COLOR} />
  }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="55" rx="36" ry={ry} fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <EyeDot cx={40} cy={48} />
      <EyeDot cx={60} cy={48} />
    </svg>
  )
}

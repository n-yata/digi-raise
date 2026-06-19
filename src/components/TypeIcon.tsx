import type { CreatureType } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'
import { SVG_OUTLINE_COLOR } from '../data/spriteConfig'
import { TYPE_ICON_PATHS } from '../data/typeIconPaths'

export interface TypeIconProps {
  type: CreatureType
  size?: number
  withBg?: boolean
}

export function TypeIcon({ type, size = 24, withBg = false }: TypeIconProps) {
  const color = TYPE_COLORS[type]
  const d = TYPE_ICON_PATHS[type]
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-label={`${type} type`}>
      {withBg && <circle cx="12" cy="12" r="11" fill={color} opacity="0.15" />}
      {d && (
        <path
          d={d}
          fill={color}
          stroke={SVG_OUTLINE_COLOR}
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { ShadowVeil } from './parts/ShadowVeil'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const DarkBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ShadowVeil x={50} y={44} scale={0.8} color={color} variant="wisp" />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const DarkChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ShadowVeil x={50} y={24} scale={1.2} color={color} variant="veil" />
      <circle cx="50" cy="42" r="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ShadowVeil x={34} y={70} scale={0.8} color={color} variant="wisp" />
      <ShadowVeil x={66} y={70} scale={0.8} color={color} variant="wisp" />
      <ellipse cx="42" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const DarkAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ShadowVeil x={50} y={16} scale={1.4} color={color} variant="veil" />
      <ShadowVeil x={34} y={22} scale={0.9} color={color} variant="wisp" />
      <ShadowVeil x={66} y={22} scale={0.9} color={color} variant="wisp" />
      <circle cx="50" cy="36" r="18" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={43} y={35} variant={eye} />
      <Eye x={57} y={35} variant={eye} />
      <Mouth x={50} y={44} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ShadowVeil x={24} y={58} scale={1.0} color={color} variant="veil" />
      <ShadowVeil x={76} y={58} scale={1.0} color={color} variant="veil" />
      <ellipse cx="40" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const DarkPerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ShadowVeil x={50} y={10} scale={1.6} color={color} variant="cloak" />
      <ShadowVeil x={32} y={16} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={68} y={16} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={16} y={30} scale={0.9} color={color} variant="wisp" />
      <ShadowVeil x={84} y={30} scale={0.9} color={color} variant="wisp" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ShadowVeil x={22} y={56} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={78} y={56} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={50} y={88} scale={0.9} color={color} variant="wisp" />
    </svg>
  )
}

const DarkUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ShadowVeil x={50} y={6} scale={2.0} color={color} variant="cloak" />
      <ShadowVeil x={28} y={12} scale={1.3} color={color} variant="cloak" />
      <ShadowVeil x={72} y={12} scale={1.3} color={color} variant="cloak" />
      <ShadowVeil x={12} y={26} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={88} y={26} scale={1.1} color={color} variant="veil" />
      <ShadowVeil x={14} y={52} scale={1.0} color={color} variant="wisp" />
      <ShadowVeil x={86} y={52} scale={1.0} color={color} variant="wisp" />
      <ellipse cx="50" cy="62" rx="24" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ShadowVeil x={30} y={78} scale={1.0} color={color} variant="wisp" />
      <ShadowVeil x={70} y={78} scale={1.0} color={color} variant="wisp" />
    </svg>
  )
}

export const DarkSprites = {
  1: DarkBaby,
  2: DarkChild,
  3: DarkAdult,
  4: DarkPerfect,
  5: DarkUltimate,
} as const

import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { Bolt } from './parts/Bolt'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const ThunderBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Bolt x={50} y={44} scale={0.6} color={color} />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const ThunderChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Bolt x={50} y={22} scale={1.0} color={color} />
      <circle cx="50" cy="42" r="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Bolt x={36} y={70} scale={0.5} color={color} />
      <Bolt x={64} y={70} scale={0.5} color={color} />
      <ellipse cx="42" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const ThunderAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Bolt x={50} y={14} scale={1.2} color={color} />
      <Bolt x={30} y={20} scale={0.7} color={color} />
      <Bolt x={70} y={20} scale={0.7} color={color} />
      <circle cx="50" cy="36" r="18" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={43} y={35} variant={eye} />
      <Eye x={57} y={35} variant={eye} />
      <Mouth x={50} y={44} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Bolt x={26} y={58} scale={0.8} color={color} />
      <Bolt x={74} y={58} scale={0.8} color={color} />
      <ellipse cx="40" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const ThunderPerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Bolt x={50} y={8} scale={1.5} color={color} />
      <Bolt x={30} y={14} scale={1.0} color={color} />
      <Bolt x={70} y={14} scale={1.0} color={color} />
      <Bolt x={14} y={28} scale={0.8} color={color} />
      <Bolt x={86} y={28} scale={0.8} color={color} />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Bolt x={22} y={56} scale={1.0} color={color} />
      <Bolt x={78} y={56} scale={1.0} color={color} />
      <Bolt x={50} y={88} scale={0.8} color={color} />
    </svg>
  )
}

const ThunderUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Bolt x={50} y={4} scale={1.8} color={color} />
      <Bolt x={28} y={10} scale={1.2} color={color} />
      <Bolt x={72} y={10} scale={1.2} color={color} />
      <Bolt x={10} y={24} scale={1.0} color={color} />
      <Bolt x={90} y={24} scale={1.0} color={color} />
      <Bolt x={14} y={52} scale={0.9} color={color} />
      <Bolt x={86} y={52} scale={0.9} color={color} />
      <ellipse cx="50" cy="62" rx="24" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <Bolt x={30} y={78} scale={0.9} color={color} />
      <Bolt x={70} y={78} scale={0.9} color={color} />
    </svg>
  )
}

export const ThunderSprites = {
  1: ThunderBaby,
  2: ThunderChild,
  3: ThunderAdult,
  4: ThunderPerfect,
  5: ThunderUltimate,
} as const

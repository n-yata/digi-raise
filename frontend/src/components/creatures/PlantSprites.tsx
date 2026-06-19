import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { Leaf } from './parts/Leaf'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const PlantBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Leaf x={50} y={42} scale={0.7} color={color} angle={0} />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const PlantChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Leaf x={50} y={24} scale={0.8} color={color} angle={0} />
      <Leaf x={38} y={28} scale={0.6} color={color} angle={-30} />
      <Leaf x={62} y={28} scale={0.6} color={color} angle={30} />
      <circle cx="50" cy="42" r="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ellipse cx="42" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const PlantAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Leaf x={50} y={16} scale={1.1} color={color} angle={0} />
      <Leaf x={36} y={22} scale={0.8} color={color} angle={-35} />
      <Leaf x={64} y={22} scale={0.8} color={color} angle={35} />
      <circle cx="50" cy="36" r="18" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={43} y={35} variant={eye} />
      <Eye x={57} y={35} variant={eye} />
      <Mouth x={50} y={44} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Leaf x={24} y={58} scale={0.8} color={color} angle={-70} />
      <Leaf x={76} y={58} scale={0.8} color={color} angle={70} />
      <ellipse cx="40" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const PlantPerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Leaf x={50} y={10} scale={1.3} color={color} angle={0} />
      <Leaf x={34} y={16} scale={1.0} color={color} angle={-30} />
      <Leaf x={66} y={16} scale={1.0} color={color} angle={30} />
      <Leaf x={20} y={24} scale={0.7} color={color} angle={-55} />
      <Leaf x={80} y={24} scale={0.7} color={color} angle={55} />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Leaf x={22} y={56} scale={1.0} color={color} angle={-75} />
      <Leaf x={78} y={56} scale={1.0} color={color} angle={75} />
      <Leaf x={50} y={88} scale={0.7} color={color} angle={180} />
    </svg>
  )
}

const PlantUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Leaf x={50} y={6} scale={1.5} color={color} angle={0} />
      <Leaf x={32} y={12} scale={1.1} color={color} angle={-30} />
      <Leaf x={68} y={12} scale={1.1} color={color} angle={30} />
      <Leaf x={16} y={22} scale={0.9} color={color} angle={-55} />
      <Leaf x={84} y={22} scale={0.9} color={color} angle={55} />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ellipse cx="50" cy="64" rx="24" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Leaf x={18} y={50} scale={1.1} color={color} angle={-80} />
      <Leaf x={82} y={50} scale={1.1} color={color} angle={80} />
      <Leaf x={26} y={76} scale={0.9} color={color} angle={-110} />
      <Leaf x={74} y={76} scale={0.9} color={color} angle={110} />
      <Leaf x={50} y={90} scale={0.8} color={color} angle={180} />
    </svg>
  )
}

export const PlantSprites = {
  1: PlantBaby,
  2: PlantChild,
  3: PlantAdult,
  4: PlantPerfect,
  5: PlantUltimate,
} as const

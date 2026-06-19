import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { FlamePlume } from './parts/FlamePlume'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const FireBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <FlamePlume x={50} y={42} scale={0.6} color={color} />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const FireChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <FlamePlume x={50} y={28} scale={0.9} color={color} />
      <FlamePlume x={32} y={32} scale={0.4} color={color} />
      <FlamePlume x={68} y={32} scale={0.4} color={color} />
      <circle cx="50" cy="42" r="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="74" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <ellipse cx="42" cy="90" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="90" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const FireAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <FlamePlume x={20} y={70} scale={0.8} color={color} />
      <ellipse cx="50" cy="68" rx="28" ry="18" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <FlamePlume x={62} y={28} scale={1.1} color={color} />
      <circle cx="65" cy="46" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={61} y={45} variant={eye} />
      <Eye x={71} y={45} variant={eye} />
      <Mouth x={65} y={54} variant={mouth} />
      <ellipse cx="35" cy="86" rx="6" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="55" cy="86" rx="6" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="75" cy="86" rx="6" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const FirePerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <FlamePlume x={18} y={52} scale={1.4} color={color} />
      <FlamePlume x={82} y={52} scale={1.4} color={color} />
      <FlamePlume x={42} y={20} scale={0.9} color={color} />
      <FlamePlume x={50} y={14} scale={1.2} color={color} />
      <FlamePlume x={58} y={20} scale={0.9} color={color} />
      <ellipse cx="50" cy="64" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="40" r="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={45} y={40} variant={eye} />
      <Eye x={55} y={40} variant={eye} />
      <Mouth x={50} y={47} variant={mouth} />
      <FlamePlume x={50} y={92} scale={0.7} color={color} />
    </svg>
  )
}

const FireUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <FlamePlume x={12} y={64} scale={1.2} color={color} />
      <FlamePlume x={88} y={64} scale={1.2} color={color} />
      <FlamePlume x={26} y={88} scale={0.9} color={color} />
      <FlamePlume x={74} y={88} scale={0.9} color={color} />
      <FlamePlume x={50} y={96} scale={0.7} color={color} />
      <FlamePlume x={36} y={16} scale={0.9} color={color} />
      <FlamePlume x={50} y={8} scale={1.4} color={color} />
      <FlamePlume x={64} y={16} scale={0.9} color={color} />
      <ellipse cx="50" cy="60" rx="22" ry="24" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="38" r="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={45} y={38} variant={eye} />
      <Eye x={55} y={38} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
    </svg>
  )
}

export const FireSprites = {
  1: FireBaby,
  2: FireChild,
  3: FireAdult,
  4: FirePerfect,
  5: FireUltimate,
} as const

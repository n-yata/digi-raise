import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { Halo } from './parts/Halo'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const LightBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Halo x={50} y={42} scale={1.0} color={color} variant="ring" />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const LightChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Halo x={50} y={22} scale={1.2} color={color} variant="ring" />
      <circle cx="50" cy="42" r="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Halo x={32} y={68} scale={0.9} color={color} variant="wing" />
      <Halo x={68} y={68} scale={0.9} color={color} variant="wing" />
      <ellipse cx="42" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const LightAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Halo x={50} y={18} scale={1.4} color={color} variant="ring" />
      <circle cx="50" cy="36" r="18" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={43} y={35} variant={eye} />
      <Eye x={57} y={35} variant={eye} />
      <Mouth x={50} y={44} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Halo x={22} y={58} scale={1.2} color={color} variant="wing" />
      <Halo x={78} y={58} scale={1.2} color={color} variant="wing" />
      <ellipse cx="40" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="7" ry="5" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const LightPerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Halo x={50} y={10} scale={1.6} color={color} variant="ring" />
      <Halo x={32} y={18} scale={1.0} color={color} variant="ring" />
      <Halo x={68} y={18} scale={1.0} color={color} variant="ring" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <ellipse cx="50" cy="64" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Halo x={20} y={56} scale={1.3} color={color} variant="wing" />
      <Halo x={80} y={56} scale={1.3} color={color} variant="wing" />
      <Halo x={24} y={76} scale={1.0} color={color} variant="wing" />
      <Halo x={76} y={76} scale={1.0} color={color} variant="wing" />
    </svg>
  )
}

const LightUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <Halo x={50} y={6} scale={1.8} color={color} variant="ring" />
      <Halo x={30} y={12} scale={1.2} color={color} variant="ring" />
      <Halo x={70} y={12} scale={1.2} color={color} variant="ring" />
      <ellipse cx="50" cy="62" rx="24" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <Halo x={16} y={50} scale={1.4} color={color} variant="wing" />
      <Halo x={84} y={50} scale={1.4} color={color} variant="wing" />
      <Halo x={18} y={68} scale={1.2} color={color} variant="wing" />
      <Halo x={82} y={68} scale={1.2} color={color} variant="wing" />
      <Halo x={24} y={84} scale={1.0} color={color} variant="wing" />
      <Halo x={76} y={84} scale={1.0} color={color} variant="wing" />
    </svg>
  )
}

export const LightSprites = {
  1: LightBaby,
  2: LightChild,
  3: LightAdult,
  4: LightPerfect,
  5: LightUltimate,
} as const

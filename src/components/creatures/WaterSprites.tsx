import type { FC } from 'react'
import type { SpriteProps } from './DefaultCreatureBody'
import { getExpression } from './DefaultCreatureBody'
import { Eye } from './parts/Eye'
import { Mouth } from './parts/Mouth'
import { WaterFin } from './parts/WaterFin'
import { SVG_OUTLINE_COLOR } from '../../data/spriteConfig'

const WaterBaby: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <WaterFin x={50} y={42} scale={0.7} color={color} variant="dorsal" />
      <Eye x={42} y={60} variant={eye} />
      <Eye x={58} y={60} variant={eye} />
      <Mouth x={50} y={70} variant={mouth} />
      <ellipse cx="42" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="84" rx="5" ry="3" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const WaterChild: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, false)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <WaterFin x={50} y={28} scale={1.0} color={color} variant="dorsal" />
      <circle cx="50" cy="42" r="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={42} y={42} variant={eye} />
      <Eye x={58} y={42} variant={eye} />
      <Mouth x={50} y={52} variant={mouth} />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <WaterFin x={32} y={72} scale={0.7} color={color} variant="side" />
      <WaterFin x={68} y={72} scale={0.7} color={color} variant="side" />
      <ellipse cx="42" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
      <ellipse cx="58" cy="88" rx="6" ry="4" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="2" />
    </svg>
  )
}

const WaterAdult: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <WaterFin x={50} y={22} scale={1.3} color={color} variant="dorsal" />
      <ellipse cx="50" cy="55" rx="28" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="35" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={34} variant={eye} />
      <Eye x={56} y={34} variant={eye} />
      <Mouth x={50} y={43} variant={mouth} />
      <WaterFin x={22} y={58} scale={0.9} color={color} variant="side" />
      <WaterFin x={78} y={58} scale={0.9} color={color} variant="side" />
      <WaterFin x={50} y={80} scale={1.1} color={color} variant="tail" />
    </svg>
  )
}

const WaterPerfect: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <WaterFin x={28} y={30} scale={1.0} color={color} variant="dorsal" />
      <WaterFin x={50} y={16} scale={1.4} color={color} variant="dorsal" />
      <WaterFin x={72} y={30} scale={1.0} color={color} variant="dorsal" />
      <ellipse cx="50" cy="62" rx="26" ry="20" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="40" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={39} variant={eye} />
      <Eye x={56} y={39} variant={eye} />
      <Mouth x={50} y={48} variant={mouth} />
      <WaterFin x={20} y={58} scale={1.1} color={color} variant="side" />
      <WaterFin x={80} y={58} scale={1.1} color={color} variant="side" />
      <WaterFin x={50} y={86} scale={1.4} color={color} variant="tail" />
    </svg>
  )
}

const WaterUltimate: FC<SpriteProps> = ({ color, size, animState }) => {
  const { eye, mouth } = getExpression(animState, true)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <WaterFin x={20} y={38} scale={1.1} color={color} variant="dorsal" />
      <WaterFin x={38} y={18} scale={1.2} color={color} variant="dorsal" />
      <WaterFin x={50} y={10} scale={1.6} color={color} variant="dorsal" />
      <WaterFin x={62} y={18} scale={1.2} color={color} variant="dorsal" />
      <WaterFin x={80} y={38} scale={1.1} color={color} variant="dorsal" />
      <ellipse cx="50" cy="62" rx="24" ry="22" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <circle cx="50" cy="38" r="16" fill={color} stroke={SVG_OUTLINE_COLOR} strokeWidth="3" />
      <Eye x={44} y={37} variant={eye} />
      <Eye x={56} y={37} variant={eye} />
      <Mouth x={50} y={46} variant={mouth} />
      <WaterFin x={16} y={60} scale={1.3} color={color} variant="side" />
      <WaterFin x={84} y={60} scale={1.3} color={color} variant="side" />
      <WaterFin x={50} y={88} scale={1.6} color={color} variant="tail" />
    </svg>
  )
}

export const WaterSprites = {
  1: WaterBaby,
  2: WaterChild,
  3: WaterAdult,
  4: WaterPerfect,
  5: WaterUltimate,
} as const

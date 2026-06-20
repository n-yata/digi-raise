import { useEffect, useRef, useState } from 'react'
import type { Creature } from '../types/creature'
import { BRANCH_COLORS, BRANCH_NAMES, STAGE_NAMES, getCreatureBranch } from '../data/evolutions'
import { EXP_TO_LEVEL } from '../data/evolutions'
import { getAnimationState } from '../utils/gameLogic'
import type { ActionAnim } from '../utils/gameLogic'
import CreatureSprite from './CreatureSprite'
import StatusBars from './StatusBars'
import ActionButtons from './ActionButtons'
import TrainingMiniGame from './TrainingMiniGame'

interface MainGameProps {
  creature: Creature
  devMode: boolean
  actionAnimation: ActionAnim | null
  trainingActive: boolean
  onTrainResult: (taps: number) => void
  message: string | null
  pendingEvolution: boolean
  hatching: boolean
  onFeed: () => void
  onTrain: () => void
  onPlay: () => void
  onSleep: () => void
  onEvolve: () => void
  onStatus: () => void
  onToggleDevMode: () => void
  onBattle: () => void
}

export default function MainGame({
  creature,
  devMode,
  actionAnimation,
  trainingActive,
  onTrainResult,
  message,
  pendingEvolution,
  hatching,
  onFeed,
  onTrain,
  onPlay,
  onSleep,
  onEvolve,
  onStatus,
  onToggleDevMode,
  onBattle,
}: MainGameProps) {
  const branch = getCreatureBranch(creature.creatureId)
  const color = BRANCH_COLORS[branch]
  const animState = getAnimationState(creature, actionAnimation)
  const bgClass = `branch-bg-${branch}`
  const expNeeded = EXP_TO_LEVEL(creature.level)
  const expPct = Math.min(100, (creature.exp / expNeeded) * 100)

  const pendingRef = useRef(pendingEvolution)
  useEffect(() => { pendingRef.current = pendingEvolution }, [pendingEvolution])

  // 徘徊behavior: 卵(stage0)は歩かず静止。生後は「歩く(動)」と「立ち止まる(静)」を交互に繰り返す。
  const isEgg = creature.evolutionStage === 0
  // アクション演出中（ごはん/遊び）・トレ連打中はその場でアニメを見せるため徘徊を止める
  const ambient = !isEgg && !actionAnimation && !trainingActive && (animState === 'idle' || animState === 'happy')

  const [walkX, setWalkX] = useState(0)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [phase, setPhase] = useState<'walk' | 'rest'>('rest')
  const moveRef = useRef<{ x: number; dir: 1 | -1 }>({ x: 0, dir: 1 })
  const phaseRef = useRef<'walk' | 'rest'>('rest')

  useEffect(() => {
    if (!ambient) {
      moveRef.current.x = 0
      phaseRef.current = 'rest'
      setWalkX(0)
      setPhase('rest')
      return
    }
    const RANGE = 56
    const SPEED = 0.4

    let phaseTimer: ReturnType<typeof setTimeout>
    const nextPhase = () => {
      if (phaseRef.current === 'rest') {
        // 歩き出す（半々で向きを変える）
        if (Math.random() < 0.5) moveRef.current.dir = moveRef.current.dir === 1 ? -1 : 1
        setFacing(moveRef.current.dir)
        phaseRef.current = 'walk'
        setPhase('walk')
        phaseTimer = setTimeout(nextPhase, 900 + Math.random() * 1300) // 動: 0.9〜2.2秒（短め）
      } else {
        phaseRef.current = 'rest'
        setPhase('rest')
        phaseTimer = setTimeout(nextPhase, 4000 + Math.random() * 5000) // 静: 4〜9秒（長め＝落ち着く）
      }
    }
    // 立ち止まりから開始し、しばらくして歩き出す
    phaseRef.current = 'rest'
    setPhase('rest')
    phaseTimer = setTimeout(nextPhase, 2500 + Math.random() * 3000)

    const mover = setInterval(() => {
      if (phaseRef.current !== 'walk') return
      const s = moveRef.current
      let nx = s.x + s.dir * SPEED
      if (nx >= RANGE) { nx = RANGE; s.dir = -1; setFacing(-1) }
      else if (nx <= -RANGE) { nx = -RANGE; s.dir = 1; setFacing(1) }
      s.x = nx
      setWalkX(nx)
    }, 16)

    return () => { clearTimeout(phaseTimer); clearInterval(mover) }
  }, [ambient])

  // スプライト状態: 卵=静止 / トレ連打中=attack / 徘徊中=歩行(動)or休憩(静) / それ以外=感情そのまま
  const spriteAnim: typeof animState | 'walking' = isEgg
    ? 'idle'
    : trainingActive
      ? 'attack'
      : !ambient
        ? animState
        : phase === 'walk'
          ? 'walking'
          : animState === 'happy' ? 'happy' : 'idle'

  return (
    <div
      className={`h-[100dvh] overflow-hidden flex flex-col ${bgClass} scanlines`}
      style={{ maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3 pb-2 shrink-0"
        style={{ borderBottom: `1px solid ${color}33` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span style={{ display: 'inline-block', width: '1.1rem', height: '1.1rem', borderRadius: '50%', background: color }} />
              <span className="font-pixel" style={{ fontSize: '1rem', color: '#e0e0e0' }}>
                {creature.name}
              </span>
            </div>
            <div className="font-pixel mt-1" style={{ fontSize: '0.7rem', color }}>
              {STAGE_NAMES[creature.evolutionStage]} — {creature.evolutionName}
            </div>
          </div>

          {/* Dev mode toggle */}
          <button
            onClick={onToggleDevMode}
            className="px-2 py-1 rounded font-pixel transition-all"
            style={{
              fontSize: '0.5rem',
              background: devMode ? '#ffd70033' : '#16213e',
              border: `1px solid ${devMode ? '#ffd700' : '#334155'}`,
              color: devMode ? '#ffd700' : '#64748b',
            }}
            title="開発モード切替"
          >
            DEV
          </button>
        </div>

        {/* Type badge */}
        <div className="flex gap-2 mt-2">
          <span
            className="font-pixel px-2 py-0.5 rounded-full"
            style={{ fontSize: '0.5rem', background: `${color}22`, color, border: `1px solid ${color}44` }}
          >
            {BRANCH_NAMES[branch]}
          </span>
          {creature.isSleeping && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.5rem', background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa44' }}>
              おやすみ中
            </span>
          )}
          {devMode && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.5rem', background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044' }}>
              開発モード
            </span>
          )}
        </div>
      </div>

      {/* Creature display area (伸縮してスクロールを防ぐ) */}
      <div
        className="relative flex flex-1 min-h-0 flex-col items-center justify-center py-2 mx-4 mt-2 rounded-xl overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at center, ${color}11 0%, transparent 70%)`,
          border: `1px solid ${color}22`,
          minHeight: 96,
        }}
      >
        {/* Message popup */}
        {message && (
          <div
            className="message-popup absolute top-2 left-1/2 z-20 font-pixel px-3 py-2 rounded-lg"
            style={{
              fontSize: '0.6rem',
              background: '#16213e',
              border: `1px solid ${color}`,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </div>
        )}

        <div
          className={isEgg ? (hatching ? 'egg-hatch' : 'egg-wobble') : ''}
          style={isEgg ? undefined : { transform: `translateX(${walkX}px)`, willChange: 'transform' }}
        >
          <div style={{ transform: `scaleX(${facing})` }}>
            <CreatureSprite
              creatureId={creature.creatureId}
              stage={creature.evolutionStage}
              animState={spriteAnim}
            />
          </div>
        </div>

        {/* トレーニング連打ミニゲーム（クリーチャー表示エリア内オーバーレイ） */}
        {trainingActive && (
          <TrainingMiniGame color={color} onResult={onTrainResult} />
        )}

        {/* 卵のふ化フラッシュ（殻が割れてクリーチャーが現れる閃光） */}
        {hatching && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none egg-hatch-flash"
            style={{
              zIndex: 15,
              background: `radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, ${color}55 38%, transparent 70%)`,
            }}
          />
        )}

        {/* Evolution ready glow */}
        {pendingEvolution && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
              animation: 'pulseGlow 1s ease-in-out infinite',
              boxShadow: `inset 0 0 30px ${color}33`,
            }}
          />
        )}
      </div>

      {/* Stats row */}
      <div
        className="mx-4 mt-2 px-3 py-1.5 rounded-lg grid grid-cols-5 gap-1 shrink-0"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        {[
          { label: 'LV', value: creature.level },
          { label: 'ATK', value: creature.atk },
          { label: 'DEF', value: creature.def },
          { label: 'SPD', value: creature.spd },
          { label: '体重', value: creature.weight },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>{label}</span>
            <span className="font-pixel" style={{ fontSize: '0.6rem', color: '#e0e0e0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* EXP bar */}
      <div className="mx-4 mt-1 shrink-0">
        <div className="flex justify-between mb-0.5">
          <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>EXP</span>
          <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>
            {creature.exp}/{expNeeded}
          </span>
        </div>
        <div className="w-full rounded-sm overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${expPct}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
            }}
          />
        </div>
      </div>

      {/* Status bars */}
      <div className="mx-4 mt-2 shrink-0">
        <StatusBars creature={creature} />
      </div>

      {/* Age display */}
      <div className="mx-4 mt-1 shrink-0">
        <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#64748b' }}>
          年齢: {Math.floor(creature.age)}日
        </span>
      </div>

      {/* Action buttons */}
      <div className="mx-4 mt-2 mb-3 shrink-0">
        <ActionButtons
          creature={creature}
          onFeed={onFeed}
          onTrain={onTrain}
          onPlay={onPlay}
          onSleep={onSleep}
          onEvolve={onEvolve}
          onStatus={onStatus}
          onBattle={onBattle}
        />
      </div>
    </div>
  )
}

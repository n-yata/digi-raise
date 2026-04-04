import { useEffect, useRef } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS, TYPE_EMOJIS, STAGE_NAMES } from '../data/evolutions'
import { EXP_TO_LEVEL } from '../data/evolutions'
import { getAnimationState } from '../utils/gameLogic'
import CreatureSprite from './CreatureSprite'
import StatusBars from './StatusBars'
import ActionButtons from './ActionButtons'

interface MainGameProps {
  creature: Creature
  devMode: boolean
  attackAnimation: boolean
  message: string | null
  pendingEvolution: boolean
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
  attackAnimation,
  message,
  pendingEvolution,
  onFeed,
  onTrain,
  onPlay,
  onSleep,
  onEvolve,
  onStatus,
  onToggleDevMode,
  onBattle,
}: MainGameProps) {
  const color = TYPE_COLORS[creature.type]
  const animState = getAnimationState(creature, attackAnimation)
  const bgClass = `type-bg-${creature.type.toLowerCase()}`
  const expNeeded = EXP_TO_LEVEL(creature.level)
  const expPct = Math.min(100, (creature.exp / expNeeded) * 100)

  const pendingRef = useRef(pendingEvolution)
  useEffect(() => { pendingRef.current = pendingEvolution }, [pendingEvolution])

  return (
    <div
      className={`min-h-screen flex flex-col ${bgClass} scanlines`}
      style={{ maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-2"
        style={{ borderBottom: `1px solid ${color}33` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color, fontSize: '1.1rem' }}>{TYPE_EMOJIS[creature.type]}</span>
              <span className="font-pixel" style={{ fontSize: '0.75rem', color: '#e0e0e0' }}>
                {creature.name}
              </span>
            </div>
            <div className="font-pixel mt-1" style={{ fontSize: '0.5rem', color }}>
              {STAGE_NAMES[creature.evolutionStage]} — {creature.evolutionName}
            </div>
          </div>

          {/* Dev mode toggle */}
          <button
            onClick={onToggleDevMode}
            className="px-2 py-1 rounded font-pixel transition-all"
            style={{
              fontSize: '0.4rem',
              background: devMode ? '#ffd70033' : '#16213e',
              border: `1px solid ${devMode ? '#ffd700' : '#334155'}`,
              color: devMode ? '#ffd700' : '#64748b',
            }}
            title="開発モード切替"
          >
            {devMode ? '⚡DEV' : 'DEV'}
          </button>
        </div>

        {/* Type badge */}
        <div className="flex gap-2 mt-2">
          <span
            className="font-pixel px-2 py-0.5 rounded-full"
            style={{ fontSize: '0.45rem', background: `${color}22`, color, border: `1px solid ${color}44` }}
          >
            {creature.type.toUpperCase()}
          </span>
          {creature.isSleeping && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.45rem', background: '#60a5fa22', color: '#60a5fa', border: '1px solid #60a5fa44' }}>
              💤 おやすみ中
            </span>
          )}
          {devMode && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.45rem', background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044' }}>
              ⚡ 開発モード
            </span>
          )}
        </div>
      </div>

      {/* Creature display area */}
      <div
        className="relative flex flex-col items-center justify-center py-6 mx-4 mt-3 rounded-xl"
        style={{
          background: `radial-gradient(ellipse at center, ${color}11 0%, transparent 70%)`,
          border: `1px solid ${color}22`,
          minHeight: 200,
        }}
      >
        {/* Message popup */}
        {message && (
          <div
            className="message-popup absolute top-2 left-1/2 z-20 font-pixel px-3 py-2 rounded-lg"
            style={{
              fontSize: '0.55rem',
              background: '#16213e',
              border: `1px solid ${color}`,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </div>
        )}

        <CreatureSprite
          type={creature.type}
          stage={creature.evolutionStage}
          animState={animState}
        />

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
        className="mx-4 mt-2 px-3 py-2 rounded-lg grid grid-cols-5 gap-1"
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
            <span className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>{label}</span>
            <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#e0e0e0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* EXP bar */}
      <div className="mx-4 mt-1">
        <div className="flex justify-between mb-0.5">
          <span className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>EXP</span>
          <span className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>
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
      <div className="mx-4 mt-3">
        <StatusBars creature={creature} typeColor={color} />
      </div>

      {/* Age display */}
      <div className="mx-4 mt-1 flex justify-between">
        <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>
          年齢: {Math.floor(creature.age)}日
        </span>
        <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>
          幸福: {Math.floor(creature.happiness)}/100
        </span>
      </div>

      {/* Action buttons */}
      <div className="mx-4 mt-3 mb-6">
        <ActionButtons
          creature={creature}
          onFeed={onFeed}
          onTrain={onTrain}
          onPlay={onPlay}
          onSleep={onSleep}
          onEvolve={onEvolve}
          onStatus={onStatus}
        />

        {/* Battle button */}
        <div className="mt-2">
          <button
            onClick={onBattle}
            disabled={creature.isSleeping || !creature.isAlive}
            className="relative flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-150 active:scale-95 w-full"
            style={{
              minHeight: 48,
              padding: '8px 16px',
              background: creature.isSleeping || !creature.isAlive
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #ef444422, #ef444411)',
              border: `2px solid ${creature.isSleeping || !creature.isAlive ? 'rgba(255,255,255,0.1)' : '#ef444466'}`,
              boxShadow: creature.isSleeping || !creature.isAlive ? 'none' : '0 2px 8px #ef444433',
              opacity: creature.isSleeping || !creature.isAlive ? 0.4 : 1,
              cursor: creature.isSleeping || !creature.isAlive ? 'not-allowed' : 'pointer',
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>⚔️</span>
              <span style={{ fontSize: '0.5rem', color: creature.isSleeping || !creature.isAlive ? '#666' : '#fca5a5', letterSpacing: '0.05em' }}>
                バトル
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS, STAGE_NAMES } from '../data/evolutions'

interface DeathScreenProps {
  creature: Creature
  hasOtherAliveCreatures: boolean
  onStartOver: () => void
  onGoToCreatureList: () => void
}

export default function DeathScreen({ creature, hasOtherAliveCreatures, onStartOver, onGoToCreatureList }: DeathScreenProps) {
  const [showButton, setShowButton] = useState(false)
  const color = TYPE_COLORS[creature.type]

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const rainDrops = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      left: `${i * 8 + Math.random() * 5}%`,
      animationDuration: `${1.5 + Math.random()}s`,
      animationDelay: `${Math.random() * 2}s`,
    })),
  [])

  const achievements = [
    { label: '最終ステージ', value: STAGE_NAMES[creature.evolutionStage] },
    { label: '最終レベル', value: `Lv.${creature.level}` },
    { label: '生きた日数', value: `${Math.floor(creature.age)}日` },
    { label: '食事回数', value: `${creature.feedCount}回` },
    { label: 'トレーニング', value: `${creature.trainCount}回` },
    { label: '遊んだ回数', value: `${creature.playCount}回` },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 scanlines"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)' }}
    >
      {/* Rain effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {rainDrops.map((drop, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 1,
              height: 20,
              background: `linear-gradient(180deg, transparent, ${color}44)`,
              left: drop.left,
              top: '-10px',
              animation: `float ${drop.animationDuration} linear infinite`,
              animationDelay: drop.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="text-6xl mb-4 grayscale opacity-50" style={{ filter: 'grayscale(1)' }}>
        💀
      </div>

      <h2 className="font-pixel text-center mb-2" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
        {creature.name}は...
      </h2>
      <p className="font-pixel text-center mb-6" style={{ fontSize: '0.7rem', color: '#475569' }}>
        しんでしまった...
      </p>

      {/* Sad message */}
      <div
        className="w-full max-w-xs px-4 py-4 rounded-xl mb-6 text-center"
        style={{ background: '#16213e', border: '1px solid #1e293b' }}
      >
        <p className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b', lineHeight: 2 }}>
          もっと食べさせてあげれば<br />よかった...💧<br />
          また一緒に旅をしよう。
        </p>
      </div>

      {/* Achievement card */}
      <div
        className="w-full max-w-xs px-4 py-4 rounded-xl mb-6"
        style={{ background: '#16213e', border: `1px solid ${color}33` }}
      >
        <div className="font-pixel text-center mb-3" style={{ fontSize: '0.55rem', color }}>
          ── 記録 ──
        </div>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-pixel" style={{ fontSize: '0.4rem', color: '#475569' }}>{label}</div>
              <div className="font-pixel" style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {showButton && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {hasOtherAliveCreatures && (
            <button
              onClick={onGoToCreatureList}
              className="w-full px-8 py-4 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-125 bounce-in"
              style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, #1e3a5f, #0f3460)',
                border: '2px solid #4fc3f7',
                color: '#4fc3f7',
                boxShadow: '0 0 15px #4fc3f733',
              }}
            >
              他のクリーチャーを見る
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('すべてのセーブデータが消えます。本当によろしいですか？')) {
                onStartOver()
              }
            }}
            className="w-full px-8 py-4 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-110 bounce-in"
            style={hasOtherAliveCreatures ? {
              fontSize: '0.55rem',
              background: '#1a0a0a',
              border: '1px solid #7f1d1d',
              color: '#94a3b8',
            } : {
              fontSize: '0.65rem',
              background: 'linear-gradient(135deg, #1e3a5f, #0f3460)',
              border: '2px solid #4fc3f7',
              color: '#4fc3f7',
              boxShadow: '0 0 15px #4fc3f733',
            }}
          >
            {hasOtherAliveCreatures ? 'すべてのデータを消して最初から' : 'もう一度はじめる'}
          </button>
        </div>
      )}
    </div>
  )
}

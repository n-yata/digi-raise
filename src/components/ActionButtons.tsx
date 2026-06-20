import type { Creature } from '../types/creature'
import { canEvolve } from '../utils/evolution'

interface ActionButtonsProps {
  creature: Creature
  onFeed: () => void
  onTrain: () => void
  onPlay: () => void
  onToggleLights: () => void
  onEvolve: () => void
  onStatus: () => void
  onBattle: () => void
}

interface BtnProps {
  label: string
  onClick: () => void
  disabled?: boolean
  accent?: string
  pulse?: boolean
}

function ActionBtn({ label, onClick, disabled, accent = '#4fc3f7', pulse }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center gap-1
        rounded-lg transition-all duration-150 active:scale-95
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-125'}
        ${pulse ? 'animate-retro-blink' : ''}
      `}
      style={{
        minHeight: 52,
        minWidth: 72,
        padding: '6px 4px',
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : `linear-gradient(135deg, ${accent}22, ${accent}11)`,
        border: `2px solid ${disabled ? 'rgba(255,255,255,0.1)' : accent + '66'}`,
        boxShadow: disabled ? 'none' : `0 2px 8px ${accent}33`,
      }}
    >
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: disabled ? '#666' : '#ccc', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </button>
  )
}

export default function ActionButtons({
  creature,
  onFeed,
  onTrain,
  onPlay,
  onToggleLights,
  onEvolve,
  onStatus,
  onBattle,
}: ActionButtonsProps) {
  const sleeping = creature.isSleeping
  const lightsOn = creature.lightsOn ?? true
  const canEvolveNow = canEvolve(creature)
  const isEgg = creature.evolutionStage === 0

  // タマゴステージ: 自動ふ化のため操作不要
  if (isEgg) {
    return null
  }

  return (
    <div className="w-full">
      {/* Evolution button - full width when available */}
      {canEvolveNow && (
        <button
          onClick={onEvolve}
          className="w-full mb-3 py-3 rounded-lg font-pixel text-sm animate-retro-blink"
          style={{
            background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
            backgroundSize: '200% 100%',
            animation: 'evolveGradient 2s linear infinite, retroBlink 1s steps(1) infinite',
            border: '2px solid #ffd700',
            color: '#111',
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
            boxShadow: '0 0 20px #ffd70088',
          }}
        >
          進化できる！タップして進化！
        </button>
      )}

      {/* Main action grid */}
      <div className="grid grid-cols-4 gap-2">
        <ActionBtn
          label="ご飯"
          onClick={onFeed}
          disabled={sleeping}
          accent="#fb923c"
        />
        <ActionBtn
          label="トレーニング"
          onClick={onTrain}
          disabled={sleeping || creature.hunger <= 0}
          accent="#f43f5e"
        />
        <ActionBtn
          label="遊ぶ"
          onClick={onPlay}
          disabled={sleeping || creature.hunger <= 0}
          accent="#a78bfa"
        />
        <ActionBtn
          label={lightsOn ? '電気を消す' : '電気をつける'}
          onClick={onToggleLights}
          accent="#60a5fa"
        />
      </div>

      {/* Battle & Status buttons */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ActionBtn
          label="バトル"
          onClick={onBattle}
          disabled={sleeping || !creature.isAlive}
          accent="#ef4444"
        />
        <ActionBtn
          label="ステータス"
          onClick={onStatus}
          accent="#94a3b8"
        />
      </div>
    </div>
  )
}

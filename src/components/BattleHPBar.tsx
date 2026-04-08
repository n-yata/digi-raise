interface BattleHPBarProps {
  label: string
  hp: number
  maxHp: number
  type: string
}

function getBarColor(hp: number, maxHp: number): string {
  const ratio = maxHp > 0 ? hp / maxHp : 0
  if (ratio > 0.5) return '#4ade80'
  if (ratio > 0.25) return '#facc15'
  return '#f87171'
}

export default function BattleHPBar({ label, hp, maxHp, type }: BattleHPBarProps) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  const barColor = getBarColor(hp, maxHp)

  return (
    <div
      className="px-3 py-2 rounded-lg"
      style={{ background: '#16213e', border: '1px solid #0f3460' }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#e0e0e0' }}>
          {label}
        </span>
        <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#94a3b8' }}>
          {type.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-sm overflow-hidden"
          style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${ratio * 100}%`,
              background: barColor,
              boxShadow: `0 0 6px ${barColor}88`,
            }}
          />
        </div>
        <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#e0e0e0', minWidth: 60, textAlign: 'right' }}>
          {hp} / {maxHp}
        </span>
      </div>
    </div>
  )
}

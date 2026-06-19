import type { Creature } from '../types/creature'

interface BarProps {
  label: string
  value: number
  max: number
  color: string
}

function Bar({ label, value, max, color }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const isLow = pct < 25

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs flex items-center gap-1" style={{ fontSize: '0.55rem' }}>
          {label}
        </span>
        <span className="text-xs tabular-nums" style={{ fontSize: '0.55rem', color }}>
          {Math.floor(value)}/{max}
        </span>
      </div>
      <div
        className="w-full rounded-sm overflow-hidden"
        style={{ height: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="h-full bar-fill transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isLow
              ? `linear-gradient(90deg, #ef4444, #f97316)`
              : `linear-gradient(90deg, ${color}bb, ${color})`,
            boxShadow: `0 0 6px ${color}88`,
          }}
        />
      </div>
    </div>
  )
}

interface StatusBarsProps {
  creature: Creature
}

export default function StatusBars({ creature }: StatusBarsProps) {
  return (
    <div className="w-full">
      <Bar label="HP" value={creature.hp} max={creature.maxHp} color="#4ade80" />
      <Bar label="空腹" value={creature.hunger} max={100} color="#fb923c" />
    </div>
  )
}

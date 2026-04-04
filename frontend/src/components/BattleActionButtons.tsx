import { useState } from 'react'
import type { BattleAction } from '../types/battle'

interface BattleActionButtonsProps {
  onSelect: (action: BattleAction) => void
  disabled: boolean
  specialCooldown: number
}

interface ActionBtnConfig {
  action: BattleAction
  label: string
  icon: string
  accent: string
}

const BUTTONS: ActionBtnConfig[] = [
  { action: 'attack', label: 'こうげき', icon: '⚔️', accent: '#f43f5e' },
  { action: 'guard', label: 'ガード', icon: '🛡️', accent: '#60a5fa' },
  { action: 'special', label: '特殊', icon: '✨', accent: '#a78bfa' },
]

export default function BattleActionButtons({
  onSelect,
  disabled,
  specialCooldown,
}: BattleActionButtonsProps) {
  const [selected, setSelected] = useState<BattleAction | null>(null)

  const handleSelect = (action: BattleAction) => {
    if (disabled || selected !== null) return
    if (action === 'special' && specialCooldown > 0) return
    setSelected(action)
    onSelect(action)
  }

  // 親からdisabledが解除されたらselectedをリセット
  // (phase変わって次のターンになったとき)
  // disabled=falseになったタイミングでリセット
  const isFullyDisabled = disabled

  return (
    <div className="grid grid-cols-3 gap-2">
      {BUTTONS.map(({ action, icon, accent }) => {
        const isSpecialOnCooldown = action === 'special' && specialCooldown > 0
        const btnDisabled = isFullyDisabled || selected !== null || isSpecialOnCooldown
        const isSelected = selected === action
        const label = action === 'special' && specialCooldown > 0
          ? `特殊（残り${specialCooldown}T）`
          : action === 'special'
          ? '特殊技'
          : action === 'guard'
          ? 'ガード'
          : 'こうげき'

        return (
          <button
            key={action}
            onClick={() => handleSelect(action)}
            disabled={btnDisabled}
            className="relative flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-150 active:scale-95"
            style={{
              minHeight: 64,
              padding: '8px 4px',
              background: isSelected
                ? `linear-gradient(135deg, ${accent}55, ${accent}33)`
                : btnDisabled
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, ${accent}22, ${accent}11)`,
              border: `2px solid ${
                isSelected ? accent : btnDisabled ? 'rgba(255,255,255,0.1)' : accent + '66'
              }`,
              boxShadow: isSelected ? `0 0 12px ${accent}66` : btnDisabled ? 'none' : `0 2px 8px ${accent}33`,
              opacity: btnDisabled && !isSelected ? 0.4 : 1,
              cursor: btnDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span
              className="font-pixel"
              style={{
                fontSize: '0.4rem',
                color: isSelected ? '#fff' : btnDisabled ? '#666' : '#ccc',
                letterSpacing: '0.03em',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

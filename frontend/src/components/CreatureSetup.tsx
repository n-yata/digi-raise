import { useState } from 'react'
import type { CreatureType } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'
import { createNewCreature } from '../utils/gameLogic'

interface CreatureSetupProps {
  onStart: (creature: ReturnType<typeof createNewCreature>) => void
  onBack: () => void
}

const TYPE_DESCRIPTIONS: Record<CreatureType, string> = {
  Fire:    '炎の力！攻撃力が高い',
  Water:   '水の力！バランス型',
  Plant:   '自然の力！HP回復が得意',
  Thunder: '雷の力！スピードが速い',
  Dark:    '闇の力！神秘的な強さ',
  Light:   '光の力！幸福度維持が高い',
}

const TYPES: CreatureType[] = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']

export default function CreatureSetup({ onStart, onBack }: CreatureSetupProps) {
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<CreatureType | null>(null)
  const [step, setStep] = useState<'name' | 'type'>('name')

  const handleNameNext = () => {
    if (name.trim().length === 0) return
    setStep('type')
  }

  const handleStart = () => {
    if (!selectedType || !name.trim()) return
    const creature = createNewCreature(name.trim(), selectedType)
    onStart(creature)
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
        style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
      >
        <div
          className="mb-6 animate-float"
          style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }}
        />

        <h2 className="font-pixel text-center mb-8" style={{ fontSize: '1rem', color: '#ffd700' }}>
          なまえをつけてあげよう
        </h2>

        <div className="w-full max-w-xs">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNameNext()}
            maxLength={12}
            placeholder="なまえ..."
            className="w-full px-4 py-3 rounded-lg font-pixel text-center outline-none"
            style={{
              fontSize: '1rem',
              background: '#16213e',
              border: '2px solid #0f3460',
              color: '#e0e0e0',
              letterSpacing: '0.1em',
            }}
            autoFocus
          />
          <div className="text-right mt-1" style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {name.length}/12
          </div>
        </div>

        <div className="flex gap-3 mt-8 w-full max-w-xs">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.85rem',
              background: '#16213e',
              border: '2px solid #334155',
              color: '#94a3b8',
            }}
          >
            ← もどる
          </button>
          <button
            onClick={handleNameNext}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.85rem',
              background: name.trim() ? 'linear-gradient(135deg, #1e3a5f, #0f3460)' : '#111',
              border: `2px solid ${name.trim() ? '#ffd700' : '#334155'}`,
              color: name.trim() ? '#ffd700' : '#666',
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            つぎへ →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6"
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
    >
      <div
        className="mb-4 animate-float"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: selectedType ? TYPE_COLORS[selectedType] : 'rgba(255,255,255,0.18)',
        }}
      />

      <h2 className="font-pixel text-center mb-1" style={{ fontSize: '1rem', color: '#ffd700' }}>
        「{name}」のタイプを選ぼう
      </h2>

      {selectedType && (
        <p className="font-pixel text-center mb-4" style={{ fontSize: '0.7rem', color: TYPE_COLORS[selectedType] }}>
          {TYPE_DESCRIPTIONS[selectedType]}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
        {TYPES.map(type => {
          const color = TYPE_COLORS[type]
          const isSelected = selectedType === type
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-lg transition-all active:scale-95"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${color}33, ${color}22)`
                  : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isSelected ? `0 0 15px ${color}44` : 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color,
                }}
              />
              <span className="font-pixel" style={{ fontSize: '0.7rem', color: isSelected ? color : '#94a3b8' }}>
                {type}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <button
          onClick={() => setStep('name')}
          className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
          style={{
            fontSize: '0.85rem',
            background: '#16213e',
            border: '2px solid #334155',
            color: '#94a3b8',
          }}
        >
          ← もどる
        </button>
        <button
          onClick={handleStart}
          disabled={!selectedType}
          className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
          style={{
            fontSize: '0.85rem',
            background: selectedType ? `linear-gradient(135deg, ${TYPE_COLORS[selectedType]}44, ${TYPE_COLORS[selectedType]}22)` : '#111',
            border: `2px solid ${selectedType ? TYPE_COLORS[selectedType] : '#334155'}`,
            color: selectedType ? '#ffd700' : '#666',
            opacity: selectedType ? 1 : 0.5,
          }}
        >
          ゲームスタート！
        </button>
      </div>
    </div>
  )
}

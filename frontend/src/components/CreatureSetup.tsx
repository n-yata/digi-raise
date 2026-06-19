import { useState } from 'react'
import { createNewCreature } from '../utils/gameLogic'

interface CreatureSetupProps {
  onStart: (creature: ReturnType<typeof createNewCreature>) => void
  onBack: () => void
}

export default function CreatureSetup({ onStart, onBack }: CreatureSetupProps) {
  const [name, setName] = useState('')

  // タイプは選ばせない。育て方によって進化先が分岐する。
  const handleStart = () => {
    if (name.trim().length === 0) return
    onStart(createNewCreature(name.trim()))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
    >
      <div
        className="mb-6 animate-float"
        style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }}
      />

      <h2 className="font-pixel text-center mb-2" style={{ fontSize: '1rem', color: '#ffd700' }}>
        なまえをつけてあげよう
      </h2>
      <p className="font-pixel text-center mb-8" style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.6 }}>
        育て方によって進化先が変わるよ
      </p>

      <div className="w-full max-w-xs">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
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
          &lt; もどる
        </button>
        <button
          onClick={handleStart}
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
          ゲームスタート！
        </button>
      </div>
    </div>
  )
}

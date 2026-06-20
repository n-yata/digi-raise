import { useState } from 'react'
import type { Creature } from '../types/creature'
import { BRANCH_COLORS, getCreatureBranch } from '../data/evolutions'

interface Props {
  creature: Creature
  onResult: (success: boolean) => void
}

export default function TrainingMiniGame({ creature, onResult }: Props) {
  const [result, setResult] = useState<'success' | 'fail' | null>(null)
  const [chosen, setChosen] = useState<'left' | 'right' | null>(null)
  const color = BRANCH_COLORS[getCreatureBranch(creature.creatureId)]

  const handleChoice = (side: 'left' | 'right') => {
    if (chosen) return
    const success = Math.random() < 0.5
    setChosen(side)
    setResult(success ? 'success' : 'fail')
    setTimeout(() => onResult(success), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="p-6 rounded-2xl mx-4 w-full max-w-sm"
        style={{ background: '#16213e', border: `2px solid ${color}` }}
      >
        <div className="text-center mb-6 font-pixel" style={{ fontSize: '0.7rem', color }}>
          トレーニング！
        </div>

        {!result ? (
          <>
            <div
              className="text-center mb-8 font-pixel"
              style={{ fontSize: '1.1rem', color: '#e2e8f0' }}
            >
              右か左か？
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleChoice('left')}
                className="flex-1 py-8 rounded-xl font-pixel"
                style={{
                  background: `${color}22`,
                  border: `2px solid ${color}66`,
                  color,
                  fontSize: '2rem',
                }}
              >
                &lt;
              </button>
              <button
                onClick={() => handleChoice('right')}
                className="flex-1 py-8 rounded-xl font-pixel"
                style={{
                  background: `${color}22`,
                  border: `2px solid ${color}66`,
                  color,
                  fontSize: '2rem',
                }}
              >
                &gt;
              </button>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center font-pixel"
            style={{ height: 160, fontSize: '1.5rem', color: result === 'success' ? '#4ade80' : '#f87171' }}
          >
            {result === 'success' ? '成功！' : '失敗…'}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { BRANCH_COLORS, type CreatureBranch } from '../data/evolutions'

interface TitleScreenProps {
  hasExistingSave: boolean
  onNewGame: () => void
  onContinue: () => void
  onZukan?: () => void
}

const PREVIEW_BRANCHES: CreatureBranch[] = ['A', 'B', 'C', 'none']

const GLOW_COLOR: Record<CreatureBranch, string> = {
  A:    '#ffd700',
  B:    '#9b59b6',
  C:    '#3498db',
  none: '#9ca3af',
}

function createStars() {
  return Array.from({ length: 20 }).map(() => ({
    size: Math.random() * 3 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.7 + 0.3,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }))
}

export default function TitleScreen({ hasExistingSave, onNewGame, onContinue, onZukan }: TitleScreenProps) {
  const [frame, setFrame] = useState(0)
  const [stars] = useState(createStars)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % PREVIEW_BRANCHES.length), 900)
    return () => clearInterval(id)
  }, [])

  const previewBranch = PREVIEW_BRANCHES[frame]
  const glowColor = GLOW_COLOR[previewBranch]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 scanlines"
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #16213e 100%)' }}
    >
      {/* Stars（位置固定） */}
      <div className="fixed inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: s.size,
              height: s.size,
              background: 'white',
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity,
              animation: `sleepZzz ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Floating creature preview frame */}
      <div
        className="mb-6 animate-float rounded-2xl pixel-border"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 132,
          height: 132,
          background: 'radial-gradient(circle at 50% 40%, #1f2b4a 0%, #131d33 100%)',
          boxShadow: `0 0 24px ${glowColor}44`,
          border: `2px solid ${glowColor}33`,
          transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
        }}
      >
        <div
          className="creature-sprite"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor}44 0%, transparent 70%)`,
            boxShadow: `0 0 16px ${glowColor}66`,
            transition: 'background 0.5s ease, box-shadow 0.5s ease',
          }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-2">
        <h1
          className="font-pixel text-3xl mb-1"
          style={{
            color: '#ffd700',
            textShadow: '0 0 12px #ffd70088, 3px 3px 0px #b8860b, -1px -1px 0 #5a3d00',
            letterSpacing: '0.05em',
          }}
        >
          デジレイズ
        </h1>
        <div className="font-pixel text-xs" style={{ color: '#94a3b8', letterSpacing: '0.25em' }}>
          DigiRaise
        </div>
      </div>

      {/* Branch dots */}
      <div className="flex gap-1 my-4">
        {PREVIEW_BRANCHES.map((branch, i) => {
          const c = BRANCH_COLORS[branch]
          return (
            <div
              key={i}
              className="w-3 h-3"
              style={{
                background: c,
                boxShadow: i === frame ? `0 0 8px ${c}` : 'none',
                transform: i === frame ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.3s ease',
                outline: '1px solid #00000040',
              }}
            />
          )
        })}
      </div>

      {/* Tagline */}
      <p className="font-pixel text-center mb-8" style={{ fontSize: '1rem', color: '#64748b', lineHeight: 2 }}>
        育てて・進化させて・最強へ
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hasExistingSave && (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-lg font-pixel transition-all active:scale-95 hover:brightness-125"
            style={{
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #1e3a5f, #0f3460)',
              border: '2px solid #4fc3f7',
              color: '#4fc3f7',
              boxShadow: '0 0 15px #4fc3f733',
              letterSpacing: '0.1em',
            }}
          >
            つづきから
          </button>
        )}
        <button
          onClick={onNewGame}
          className="w-full py-4 rounded-lg font-pixel transition-all active:scale-95 hover:brightness-125"
          style={{
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #3d1a00, #ff6b35cc)',
            border: '2px solid #ff6b35',
            color: '#ffd700',
            boxShadow: '0 0 15px #ff6b3533',
            letterSpacing: '0.1em',
          }}
        >
          はじめから
        </button>
        {onZukan && (
          <button
            onClick={onZukan}
            className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 hover:brightness-125"
            style={{
              fontSize: '0.85rem',
              background: 'transparent',
              border: '1px solid #ffd70055',
              color: '#ffd700',
              letterSpacing: '0.15em',
            }}
          >
            図鑑をみる
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 font-pixel text-center" style={{ fontSize: '0.65rem', color: '#2a3a4a' }}>
        © 2026 DigiRaise — タマゴを孵せ！
      </div>
    </div>
  )
}

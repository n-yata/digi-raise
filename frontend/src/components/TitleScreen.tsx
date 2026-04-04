import { useEffect, useState } from 'react'

interface TitleScreenProps {
  hasExistingSave: boolean
  onNewGame: () => void
  onContinue: () => void
}

export default function TitleScreen({ hasExistingSave, onNewGame, onContinue }: TitleScreenProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 600)
    return () => clearInterval(id)
  }, [])

  const creatures = ['🔥', '💧', '🌿', '⚡', '🌑', '✨']
  const floatingCreature = creatures[frame % creatures.length]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 scanlines"
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #16213e 100%)' }}
    >
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              background: 'white',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `sleepZzz ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Floating creature preview */}
      <div className="text-6xl mb-6 animate-float" style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.5))' }}>
        {floatingCreature}
      </div>

      {/* Title */}
      <div className="text-center mb-2">
        <h1
          className="font-pixel text-3xl mb-1"
          style={{
            color: '#ffd700',
            textShadow: '0 0 10px #ffd70088, 3px 3px 0px #b8860b',
            letterSpacing: '0.05em',
          }}
        >
          デジレイズ
        </h1>
        <div className="font-pixel text-xs" style={{ color: '#94a3b8', letterSpacing: '0.2em' }}>
          DigiRaise
        </div>
      </div>

      {/* Pixel decoration */}
      <div className="flex gap-1 my-4">
        {['#ff6b35','#4fc3f7','#81c784','#ffd54f','#ce93d8','#fff9c4'].map((c, i) => (
          <div key={i} className="w-3 h-3" style={{ background: c }} />
        ))}
      </div>

      {/* Tagline */}
      <p className="font-pixel text-center mb-8" style={{ fontSize: '0.5rem', color: '#64748b', lineHeight: 2 }}>
        育てて・進化させて・最強へ
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hasExistingSave && (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-lg font-pixel transition-all active:scale-95 hover:brightness-125"
            style={{
              fontSize: '0.7rem',
              background: 'linear-gradient(135deg, #1e3a5f, #0f3460)',
              border: '2px solid #4fc3f7',
              color: '#4fc3f7',
              boxShadow: '0 0 15px #4fc3f733',
              letterSpacing: '0.1em',
            }}
          >
            📂 つづきから
          </button>
        )}
        <button
          onClick={onNewGame}
          className="w-full py-4 rounded-lg font-pixel transition-all active:scale-95 hover:brightness-125"
          style={{
            fontSize: '0.7rem',
            background: 'linear-gradient(135deg, #3d1a00, #ff6b35cc)',
            border: '2px solid #ff6b35',
            color: '#ffd700',
            boxShadow: '0 0 15px #ff6b3533',
            letterSpacing: '0.1em',
          }}
        >
          ✨ はじめから
        </button>
      </div>

      {/* Footer */}
      <div className="mt-12 font-pixel text-center" style={{ fontSize: '0.4rem', color: '#2a3a4a' }}>
        © 2026 DigiRaise — タマゴを孵せ！
      </div>
    </div>
  )
}

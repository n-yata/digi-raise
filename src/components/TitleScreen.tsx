import { useEffect, useState } from 'react'
import type { CreatureType } from '../types/creature'
import { PixelSprite, getPixelSprite } from './creatures/pixel'

interface TitleScreenProps {
  hasExistingSave: boolean
  onNewGame: () => void
  onContinue: () => void
}

// タイトルで巡回表示する代表クリーチャー（各タイプの成長期）
const PREVIEW_TYPES: CreatureType[] = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']
const GLOW_CLASS: Record<CreatureType, string> = {
  Fire: 'glow-fire', Water: 'glow-water', Plant: 'glow-plant',
  Thunder: 'glow-thunder', Dark: 'glow-dark', Light: 'glow-light', Normal: '',
}
const TYPE_DOT: Record<CreatureType, string> = {
  Fire: '#ff6b35', Water: '#4fc3f7', Plant: '#81c784',
  Thunder: '#ffd54f', Dark: '#ce93d8', Light: '#fff9c4', Normal: '#9ca3af',
}

// 背景の星は一度だけ生成して固定する（再レンダーで位置が飛ばないように）
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

export default function TitleScreen({ hasExistingSave, onNewGame, onContinue }: TitleScreenProps) {
  const [frame, setFrame] = useState(0)
  const [stars] = useState(createStars)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % PREVIEW_TYPES.length), 900)
    return () => clearInterval(id)
  }, [])

  const previewType = PREVIEW_TYPES[frame]
  const previewData = getPixelSprite(previewType, 3)

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

      {/* Floating creature preview（ドット絵・タイプ巡回） */}
      <div
        className={`mb-6 animate-float rounded-2xl pixel-border ${GLOW_CLASS[previewType]}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 132,
          height: 132,
          background: 'radial-gradient(circle at 50% 40%, #1f2b4a 0%, #131d33 100%)',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        <div className="creature-sprite">
          {previewData && <PixelSprite data={previewData} size={104} animState="happy" />}
        </div>
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

      {/* Pixel decoration（タイプ色のドット・巡回中のタイプを強調） */}
      <div className="flex gap-1 my-4">
        {PREVIEW_TYPES.map((t, i) => (
          <div
            key={i}
            className="w-3 h-3"
            style={{
              background: TYPE_DOT[t],
              boxShadow: i === frame ? `0 0 8px ${TYPE_DOT[t]}` : 'none',
              transform: i === frame ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.3s ease',
              outline: '1px solid #00000040',
            }}
          />
        ))}
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
      </div>

      {/* Footer */}
      <div className="mt-12 font-pixel text-center" style={{ fontSize: '0.65rem', color: '#2a3a4a' }}>
        © 2026 DigiRaise — タマゴを孵せ！
      </div>
    </div>
  )
}

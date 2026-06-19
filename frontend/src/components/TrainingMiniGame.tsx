import { useState, useEffect, useRef, useCallback } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

interface Props {
  creature: Creature
  onResult: (success: boolean) => void
}

const GRID_SIZE = 9
const GAME_DURATION = 8000
const MOLE_VISIBLE_MS = 800
const MOLE_INTERVAL_MS = 1000
const SUCCESS_THRESHOLD = 5

type Phase = 'countdown' | 'playing' | 'result'

export default function TrainingMiniGame({ creature, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [activeMole, setActiveMole] = useState<number | null>(null)
  const [hitCell, setHitCell] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000)
  const [result, setResult] = useState<'success' | 'fail' | null>(null)

  const scoreRef = useRef(0)
  const activeMoleRef = useRef<number | null>(null)
  const moleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false)

  const color = TYPE_COLORS[creature.type]

  const clearAllTimers = useCallback(() => {
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current)
    if (moleIntervalRef.current) clearInterval(moleIntervalRef.current)
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
  }, [])

  const spawnMole = useCallback(() => {
    // Pick a random cell different from current active
    const prev = activeMoleRef.current
    let next: number
    do {
      next = Math.floor(Math.random() * GRID_SIZE)
    } while (next === prev)

    activeMoleRef.current = next
    setActiveMole(next)

    // Hide the mole after MOLE_VISIBLE_MS
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current)
    moleTimerRef.current = setTimeout(() => {
      activeMoleRef.current = null
      setActiveMole(null)
    }, MOLE_VISIBLE_MS)
  }, [])

  const endGame = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    clearAllTimers()
    activeMoleRef.current = null
    setActiveMole(null)
    const finalScore = scoreRef.current
    const success = finalScore >= SUCCESS_THRESHOLD
    setResult(success ? 'success' : 'fail')
    setPhase('result')
  }, [clearAllTimers])

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('playing')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Game phase
  useEffect(() => {
    if (phase !== 'playing') return

    doneRef.current = false
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION / 1000)

    // Spawn first mole immediately
    spawnMole()

    // Spawn subsequent moles on interval
    moleIntervalRef.current = setInterval(() => {
      spawnMole()
    }, MOLE_INTERVAL_MS)

    // Game countdown timer
    const startTime = Date.now()
    gameTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000))
      setTimeLeft(remaining)
      if (elapsed >= GAME_DURATION) {
        endGame()
      }
    }, 200)

    return () => {
      clearAllTimers()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Result phase → call onResult after delay
  useEffect(() => {
    if (phase !== 'result' || result === null) return
    const success = result === 'success'
    endTimerRef.current = setTimeout(() => onResult(success), 1500)
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current)
    }
  }, [phase, result, onResult])

  // Unmount cleanup
  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  const handleCellClick = useCallback((index: number) => {
    if (phase !== 'playing' || doneRef.current) return
    if (activeMoleRef.current !== index) return

    // Hit!
    activeMoleRef.current = null
    setActiveMole(null)
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current)

    setHitCell(index)
    setTimeout(() => setHitCell(null), 300)

    scoreRef.current += 1
    setScore(scoreRef.current)
  }, [phase])

  const countdownLabel = countdown > 0 ? String(countdown) : 'スタート！'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="p-6 rounded-2xl mx-4 w-full max-w-sm"
        style={{ background: '#16213e', border: `2px solid ${color}` }}
      >
        {/* Header */}
        <div className="text-center mb-1 font-pixel" style={{ fontSize: '0.7rem', color }}>
          トレーニング！
        </div>
        <div className="text-center mb-4 font-pixel" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {phase === 'playing' ? 'もぐらを叩け！' : '\u00a0'}
        </div>

        {/* Score + timer row */}
        {phase === 'playing' && (
          <div
            className="flex justify-between mb-4 font-pixel"
            style={{ fontSize: '0.75rem', color: '#94a3b8' }}
          >
            <span style={{ color }}>スコア: <span style={{ color: '#fff' }}>{score}</span></span>
            <span>残り: <span style={{ color: timeLeft <= 3 ? '#f87171' : '#fff' }}>{timeLeft}s</span></span>
          </div>
        )}

        {/* Countdown overlay */}
        {phase === 'countdown' && (
          <div
            className="flex items-center justify-center mb-4 font-pixel"
            style={{ height: 200, fontSize: countdown === 0 ? '1.2rem' : '2.5rem', color }}
          >
            {countdownLabel}
          </div>
        )}

        {/* Grid */}
        {phase === 'playing' && (
          <div
            className="grid gap-2 mb-4"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {Array.from({ length: GRID_SIZE }, (_, i) => {
              const isActive = activeMole === i
              const isHit = hitCell === i
              return (
                <button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className="rounded-xl flex items-center justify-center select-none"
                  style={{
                    height: 70,
                    background: isHit
                      ? `${color}55`
                      : isActive
                        ? '#0f172a'
                        : '#0f172a',
                    border: isActive
                      ? `2px solid ${color}`
                      : '2px solid #334155',
                    transform: isHit ? 'scale(0.85)' : isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.1s ease-out, border 0.1s, background 0.1s',
                    fontSize: '1.8rem',
                    cursor: isActive ? 'pointer' : 'default',
                  }}
                >
                  {isActive ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '1.8rem',
                        height: '1.8rem',
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 10px ${color}88`,
                        animation: 'mole-pop 0.15s ease-out',
                      }}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <div className="flex flex-col items-center justify-center" style={{ height: 200 }}>
            <div
              className="font-pixel mb-3"
              style={{
                fontSize: '1.1rem',
                color: result === 'success' ? '#4ade80' : '#f87171',
              }}
            >
              {result === 'success' ? '成功！' : '失敗…'}
            </div>
            <div
              className="font-pixel"
              style={{ fontSize: '0.75rem', color: '#94a3b8' }}
            >
              スコア: {score} / {GRID_SIZE}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mole-pop {
          0%   { transform: scale(0.3); opacity: 0.5; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}

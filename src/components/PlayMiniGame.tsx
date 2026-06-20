import { useState, useCallback, useEffect, useRef } from 'react'
import type { Creature } from '../types/creature'
import { BRANCH_COLORS, getCreatureBranch, type CreatureBranch } from '../data/evolutions'

interface Props {
  creature: Creature
  onResult: (success: boolean) => void
}

type CardIcon = string

const BRANCH_ICONS: Record<CreatureBranch, [CardIcon, CardIcon, CardIcon]> = {
  A:    ['#ffd700', '#ffe566', '#b8960c'],
  B:    ['#9b59b6', '#c39bd3', '#6c3483'],
  C:    ['#3498db', '#7fb3d3', '#1a5276'],
  none: ['#9ca3af', '#cbd5e1', '#6b7280'],
}

const MAX_TURNS = 8

interface CardState {
  id: number
  icon: CardIcon
  pairId: number
  isFlipped: boolean
  isMatched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCards(branch: CreatureBranch): CardState[] {
  const icons = BRANCH_ICONS[branch]
  const pairs: CardState[] = []
  icons.forEach((icon, pairId) => {
    pairs.push({ id: pairId * 2,     icon, pairId, isFlipped: false, isMatched: false })
    pairs.push({ id: pairId * 2 + 1, icon, pairId, isFlipped: false, isMatched: false })
  })
  return shuffle(pairs)
}

export default function PlayMiniGame({ creature, onResult }: Props) {
  const branch = getCreatureBranch(creature.creatureId)
  const color = BRANCH_COLORS[branch]

  const [cards, setCards] = useState<CardState[]>(() => buildCards(branch))
  const [, setFlippedIds] = useState<number[]>([])
  const [turns, setTurns] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [success, setSuccess] = useState(false)
  const [locked, setLocked] = useState(false)

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timeoutsRef.current.push(id)
    return id
  }

  const handleCardClick = useCallback((cardId: number) => {
    if (locked || gameOver) return

    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card || card.isFlipped || card.isMatched) return prev
      return prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c)
    })

    setFlippedIds(prev => {
      // Guard: already 2 flipped or this card already in selection
      if (prev.length >= 2 || prev.includes(cardId)) return prev

      const next = [...prev, cardId]

      if (next.length === 2) {
        setLocked(true)
        const newTurns = turns + 1
        setTurns(newTurns)

        // Need to read latest cards state — use functional form in next tick
        addTimeout(() => {
          setCards(prevCards => {
            const [id1, id2] = next
            const c1 = prevCards.find(c => c.id === id1)!
            const c2 = prevCards.find(c => c.id === id2)!
            const isMatch = c1.pairId === c2.pairId

            if (isMatch) {
              const newCards = prevCards.map(c =>
                c.id === id1 || c.id === id2 ? { ...c, isMatched: true, isFlipped: true } : c
              )
              const newMatchedCount = matchedCount + 1
              setMatchedCount(newMatchedCount)

              const allMatched = newMatchedCount >= 3
              if (allMatched) {
                const won = newTurns <= MAX_TURNS
                setSuccess(won)
                setGameOver(true)
                addTimeout(() => onResult(won), 1500)
              }

              setFlippedIds([])
              setLocked(false)
              return newCards
            } else {
              // No match — flip back after delay
              addTimeout(() => {
                setCards(c =>
                  c.map(card =>
                    card.id === id1 || card.id === id2
                      ? { ...card, isFlipped: false }
                      : card
                  )
                )
                setFlippedIds([])
                setLocked(false)

                // Check turn limit failure (only if game not already over via match)
                if (newTurns >= MAX_TURNS) {
                  setGameOver(true)
                  setSuccess(false)
                  addTimeout(() => onResult(false), 1500)
                }
              }, 800)

              return prevCards
            }
          })
        }, 100)

        return next
      }

      return next
    })
  }, [locked, gameOver, turns, matchedCount, onResult])

  const remainingPairs = 3 - matchedCount

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="p-6 rounded-2xl mx-4 w-full max-w-sm"
        style={{ background: '#16213e', border: `2px solid ${color}` }}
      >
        {/* Title */}
        <div className="text-center mb-1 font-pixel" style={{ fontSize: '0.8rem', color }}>
          あそぶ！
        </div>
        <div className="text-center mb-3 font-pixel" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          ペアを見つけよう！
        </div>

        {/* Stats */}
        {!gameOver && (
          <div
            className="flex justify-center gap-6 mb-4 font-pixel"
            style={{ fontSize: '0.7rem', color: '#94a3b8' }}
          >
            <span>残り: <span style={{ color }}>{remainingPairs}</span>ペア</span>
            <span>手数: <span style={{ color: turns > MAX_TURNS ? '#f87171' : '#94a3b8' }}>{turns}</span></span>
          </div>
        )}

        {/* Card grid: 2 rows x 3 cols */}
        <div
          className="grid gap-2 mb-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || locked || gameOver}
              className="rounded-lg flex items-center justify-center select-none"
              style={{
                height: '64px',
                fontSize: '1.6rem',
                background: card.isMatched
                  ? 'rgba(74, 222, 128, 0.1)'
                  : card.isFlipped
                    ? '#1e3a5f'
                    : '#0f172a',
                border: card.isMatched
                  ? '2px solid rgba(74, 222, 128, 0.4)'
                  : card.isFlipped
                    ? `2px solid ${color}`
                    : '2px solid #334155',
                opacity: card.isMatched ? 0.4 : 1,
                transform: card.isFlipped && !card.isMatched ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.15s ease, opacity 0.3s ease, background 0.2s ease',
                cursor: card.isFlipped || card.isMatched || locked || gameOver ? 'default' : 'pointer',
              }}
            >
              {card.isFlipped || card.isMatched ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: '1.6rem',
                    height: '1.6rem',
                    borderRadius: '50%',
                    background: card.icon,
                    boxShadow: `0 0 8px ${card.icon}88`,
                  }}
                />
              ) : (
                <span className="font-pixel" style={{ fontSize: '1rem', color: '#475569' }}>?</span>
              )}
            </button>
          ))}
        </div>

        {/* Result message */}
        {gameOver && (
          <div
            className="text-center font-pixel"
            style={{ fontSize: '0.9rem', color: success ? '#4ade80' : '#f87171' }}
          >
            {success ? '楽しかった！' : 'また遊ぼう！'}
          </div>
        )}
      </div>
    </div>
  )
}

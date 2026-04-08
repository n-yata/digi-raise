import { useState, useEffect } from 'react'
import type { Creature } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'
import CreatureSprite from './CreatureSprite'

interface Props {
  creature: Creature
  onDone: () => void
}

interface FoodItem {
  id: number
  visible: boolean
  falling: boolean
}

const TOTAL_MEALS = 1
const FALL_DURATION = 600  // ms: 食べ物が落ちきるまで
const EAT_PAUSE = 300      // ms: 食べた後の間
const MEAL_INTERVAL = 900  // ms: 次の食べ物が出るまで

export default function FeedMiniGame({ creature, onDone }: Props) {
  const [bounce, setBounce] = useState(false)
  const [mealIndex, setMealIndex] = useState(0)  // 0-based, current meal being shown
  const [food, setFood] = useState<FoodItem | null>(null)
  const [showComplete, setShowComplete] = useState(false)

  const color = TYPE_COLORS[creature.type]

  // ミールシーケンスの制御
  useEffect(() => {
    if (mealIndex >= TOTAL_MEALS) return

    // 食べ物を出現させる
    const spawnTimer = setTimeout(() => {
      const id = Date.now()
      setFood({ id, visible: true, falling: false })

      // アニメーション開始 (次フレームでfallingをtrueに)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFood(prev => prev && prev.id === id ? { ...prev, falling: true } : prev)
        })
      })

      // 食べ物が落ちたらバウンス＆消去
      const eatTimer = setTimeout(() => {
        setBounce(true)
        setFood(null)

        setTimeout(() => {
          setBounce(false)

          const next = mealIndex + 1
          setMealIndex(next)

          if (next >= TOTAL_MEALS) {
            // 全部食べた
            setTimeout(() => {
              setShowComplete(true)
              setTimeout(() => onDone(), 500)
            }, 200)
          }
        }, EAT_PAUSE)
      }, FALL_DURATION)

      return () => clearTimeout(eatTimer)
    }, mealIndex === 0 ? 300 : MEAL_INTERVAL)

    return () => clearTimeout(spawnTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealIndex])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="p-6 rounded-2xl mx-4 w-full max-w-sm"
        style={{ background: '#16213e', border: `2px solid ${color}` }}
      >
        {/* タイトル */}
        <div
          className="text-center mb-2 font-pixel"
          style={{ fontSize: '0.7rem', color }}
        >
          🍖 ごはん！
        </div>

        {/* サブテキスト */}
        <div
          className="text-center mb-5 font-pixel"
          style={{ fontSize: '0.5rem', color: '#94a3b8', minHeight: '1.2em' }}
        >
          {showComplete ? '\u00a0' : 'もぐもぐ中…'}
        </div>

        {/* 演出エリア */}
        <div
          className="relative flex justify-center items-end mb-6"
          style={{ height: 200 }}
        >
          {/* 食べ物 */}
          {food && (
            <div
              className="absolute select-none"
              style={{
                fontSize: '2.5rem',
                top: food.falling ? '45%' : '-10%',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: food.falling ? 0 : 1,
                transition: `top ${FALL_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${FALL_DURATION * 0.3}ms ease ${FALL_DURATION * 0.7}ms`,
              }}
            >
              🍖
            </div>
          )}

          {/* クリーチャー */}
          <div
            style={{
              transform: bounce ? 'scale(1.15) translateY(-12px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.2s ease-out',
              position: 'absolute',
              bottom: 0,
            }}
          >
            <CreatureSprite
              type={creature.type}
              stage={creature.evolutionStage}
              animState={bounce ? 'happy' : 'idle'}
              customSvg={creature.customSprites?.[creature.evolutionStage]}
            />
          </div>
        </div>

        {/* 完了テキスト */}
        {showComplete && (
          <div
            className="text-center mb-4 font-pixel"
            style={{ fontSize: '0.9rem', color: '#4ade80' }}
          >
            もぐもぐ！🍖
          </div>
        )}

      </div>
    </div>
  )
}

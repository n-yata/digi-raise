import { useEffect, useRef, useState } from 'react'

interface Props {
  /** ブランチ色（UI装飾用） */
  color: string
  onResult: (success: boolean) => void
}

/** 連打の制限時間（ms）。 */
const TRAIN_DURATION_MS = 3000
/** 成功に必要なタップ数。 */
const TRAIN_TARGET_TAPS = 10
/** 残り時間バー更新の刻み（ms）。 */
const TICK_MS = 50

/**
 * トレーニング連打ミニゲーム（メイン画面のクリーチャー表示エリア内オーバーレイ）。
 * 制限時間内に規定回数タップできれば成功。クリーチャー自体は MainGame が描画する。
 */
export default function TrainingMiniGame({ color, onResult }: Props) {
  const [count, setCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TRAIN_DURATION_MS)
  const [done, setDone] = useState(false)
  const countRef = useRef(0)
  const doneRef = useRef(false)

  // マウント時に連打タイマーを開始。残り時間が尽きたら成否を確定して返す。
  useEffect(() => {
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const remaining = Math.max(0, TRAIN_DURATION_MS - (Date.now() - startedAt))
      setTimeLeft(remaining)
      if (remaining <= 0 && !doneRef.current) {
        doneRef.current = true
        setDone(true)
        clearInterval(timer)
        const success = countRef.current >= TRAIN_TARGET_TAPS
        setTimeout(() => onResult(success), 600)
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [onResult])

  const handleTap = () => {
    if (doneRef.current) return
    countRef.current += 1
    setCount(countRef.current)
  }

  const remainingTaps = Math.max(0, TRAIN_TARGET_TAPS - count)
  const timePct = (timeLeft / TRAIN_DURATION_MS) * 100
  const success = count >= TRAIN_TARGET_TAPS

  return (
    <button
      type="button"
      onClick={handleTap}
      className="absolute inset-0 z-20 flex flex-col items-center justify-between py-3 px-4 select-none"
      style={{ background: 'rgba(0,0,0,0.35)' }}
    >
      {/* 上部: 見出し＋残りタップ数 */}
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        <div className="font-pixel" style={{ fontSize: '0.7rem', color }}>
          {done ? (success ? 'OK！' : '時間切れ…') : '連打！'}
        </div>
        {!done && (
          <div className="font-pixel" style={{ fontSize: '0.6rem', color: '#e2e8f0' }}>
            あと {remainingTaps} 回
          </div>
        )}
      </div>

      {/* 下部: 残り時間バー */}
      <div className="w-full pointer-events-none">
        <div
          className="w-full rounded-sm overflow-hidden"
          style={{ height: 6, background: 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="h-full"
            style={{ width: `${timePct}%`, background: color, transition: `width ${TICK_MS}ms linear` }}
          />
        </div>
      </div>
    </button>
  )
}

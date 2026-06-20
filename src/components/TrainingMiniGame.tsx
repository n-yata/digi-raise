import { useEffect, useRef, useState } from 'react'

interface Props {
  /** ブランチ色（UI装飾用） */
  color: string
  /** 連打終了時にタップ総数を返す。 */
  onResult: (taps: number) => void
}

/** 連打の制限時間（ms）。 */
const TRAIN_DURATION_MS = 3000
/** 残り時間バー更新の刻み（ms）。 */
const TICK_MS = 50
/** サンドバッグが「ヒビ」段階に進むタップ数。 */
const CRACK_TAPS = 6
/** サンドバッグが「大破」段階に進むタップ数。 */
const BROKEN_TAPS = 14

/** タップ数から破壊段階（0:無傷 / 1:ヒビ / 2:大破）を求める。 */
function damageStage(taps: number): 0 | 1 | 2 {
  if (taps >= BROKEN_TAPS) return 2
  if (taps >= CRACK_TAPS) return 1
  return 0
}

/** 破壊段階ごとのサンドバッグSVG。座標系は 0 0 64 96。 */
function Sandbag({ stage, color }: { stage: 0 | 1 | 2; color: string }) {
  const tilt = stage === 2 ? -8 : 0
  return (
    <svg
      viewBox="0 0 64 96"
      width="100%"
      height="100%"
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '32px 8px', transition: 'transform 120ms ease-out' }}
      shapeRendering="crispEdges"
    >
      {/* 吊り下げ用のチェーン/ストラップ */}
      <rect x="30" y="0" width="4" height="14" fill="#9ca3af" />
      <rect x="26" y="12" width="12" height="6" fill="#6b7280" />
      {/* 本体 */}
      <rect x="18" y="16" width="28" height="64" rx="12" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      {/* 上下のベルト */}
      <rect x="18" y="26" width="28" height="5" fill="#78350f" />
      <rect x="18" y="66" width="28" height="5" fill="#78350f" />
      {/* ハイライト */}
      <rect x="23" y="34" width="5" height="28" rx="2" fill="#f59e0b" opacity="0.7" />

      {/* ヒビ（stage>=1） */}
      {stage >= 1 && (
        <g stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinejoin="round">
          <polyline points="40,32 35,40 39,46 34,54" />
          <polyline points="35,40 30,42" />
          <polyline points="28,60 33,66 29,72" />
        </g>
      )}

      {/* 大破（stage>=2）: 裂け目と飛び出す詰め物 */}
      {stage >= 2 && (
        <>
          <polygon points="32,44 44,50 40,60 30,58" fill="#1c1917" />
          <circle cx="42" cy="48" r="3" fill="#fef3c7" />
          <circle cx="46" cy="54" r="2.5" fill="#fde68a" />
          <circle cx="40" cy="62" r="2.5" fill="#fef3c7" />
          {/* インパクトの星 */}
          <g stroke={color} strokeWidth="2" strokeLinecap="round">
            <line x1="50" y1="38" x2="56" y2="34" />
            <line x1="52" y1="44" x2="59" y2="44" />
            <line x1="50" y1="50" x2="56" y2="54" />
          </g>
        </>
      )}
    </svg>
  )
}

/**
 * トレーニング連打ミニゲーム（メイン画面のクリーチャー表示エリア内オーバーレイ）。
 * 制限時間内にタップした回数だけ経験値を獲得する。タップが進むほどサンドバッグが
 * 無傷→ヒビ→大破と壊れていく。クリーチャー自体は MainGame が描画する。
 */
export default function TrainingMiniGame({ color, onResult }: Props) {
  const [count, setCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TRAIN_DURATION_MS)
  const [done, setDone] = useState(false)
  const countRef = useRef(0)
  const doneRef = useRef(false)

  // マウント時に連打タイマーを開始。残り時間が尽きたらタップ総数を返す。
  useEffect(() => {
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const remaining = Math.max(0, TRAIN_DURATION_MS - (Date.now() - startedAt))
      setTimeLeft(remaining)
      if (remaining <= 0 && !doneRef.current) {
        doneRef.current = true
        setDone(true)
        clearInterval(timer)
        const taps = countRef.current
        setTimeout(() => onResult(taps), 700)
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [onResult])

  const handleTap = () => {
    if (doneRef.current) return
    countRef.current += 1
    setCount(countRef.current)
  }

  const timePct = (timeLeft / TRAIN_DURATION_MS) * 100
  const stage = damageStage(count)
  // タップごとにサンドバッグを小さく揺らす（偶奇で左右に振る）。
  const shake = done ? 0 : count % 2 === 0 ? -2 : 2

  return (
    <button
      type="button"
      onClick={handleTap}
      className="absolute inset-0 z-20 flex flex-col items-center justify-between py-3 px-4 select-none"
      style={{ background: 'rgba(0,0,0,0.35)' }}
    >
      {/* 上部: 見出し＋獲得EXP */}
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        <div className="font-pixel" style={{ fontSize: '0.7rem', color }}>
          {done ? (count > 0 ? `${stage === 2 ? '大破！' : 'OK！'} +${count * 2} EXP` : '時間切れ…') : '連打！'}
        </div>
        {!done && (
          <div className="font-pixel" style={{ fontSize: '0.6rem', color: '#e2e8f0' }}>
            {count} タップ / +{count * 2} EXP
          </div>
        )}
      </div>

      {/* 中段: サンドバッグ（右寄せ＝クリーチャーが叩く対象） */}
      <div
        className="pointer-events-none absolute"
        style={{
          right: '14%',
          top: '50%',
          width: '26%',
          height: '60%',
          transform: `translate(${shake}px, -50%)`,
          transition: 'transform 60ms ease-out',
        }}
      >
        <Sandbag stage={stage} color={color} />
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

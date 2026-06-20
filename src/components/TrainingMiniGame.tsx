import { useEffect, useRef, useState } from 'react'
import { ItemSprite } from './items/ItemSprite'
import { SANDBAG_SPRITES } from './items/sandbagSprites'

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

/**
 * 破壊段階ごとのサンドバッグをドット絵で描画する。
 * クリーチャー本体・遊び道具と同じ ItemSprite（文字グリッド + パレット）方式で統一。
 * 大破時のみ衝撃で少し傾ける。SVG は親要素いっぱいに伸縮させる。
 */
function Sandbag({ stage }: { stage: 0 | 1 | 2 }) {
  const tilt = stage === 2 ? -8 : 0
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'top center',
        transition: 'transform 120ms ease-out',
        // ItemSprite は size 指定だが、ここでは親いっぱいに伸ばしたいので SVG を上書き。
        display: 'grid',
        placeItems: 'center',
      }}
      className="[&>svg]:h-full [&>svg]:w-auto"
    >
      <ItemSprite data={SANDBAG_SPRITES[stage]} size={0} />
    </div>
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
        <Sandbag stage={stage} />
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

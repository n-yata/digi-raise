interface BattleResultProps {
  winner: 'me' | 'opponent' | 'draw'
  expGain: number
  happinessChange: number
  onClose: () => void
}

export default function BattleResult({ winner, expGain, happinessChange, onClose }: BattleResultProps) {
  const isWin = winner === 'me'
  const isDraw = winner === 'draw'

  const title = isWin ? '勝利！' : isDraw ? '引き分け' : '敗北...'
  const titleColor = isWin ? '#ffd700' : isDraw ? '#94a3b8' : '#f87171'
  const bgAccent = isWin ? '#ffd70022' : isDraw ? '#94a3b822' : '#f8717122'
  const borderColor = isWin ? '#ffd70066' : isDraw ? '#94a3b866' : '#f8717166'
  const message = isWin
    ? 'よくやった！強さを見せつけた！'
    : isDraw
    ? 'いい戦いだった...'
    : '次は負けないぞ...'

  const happinessLabel = happinessChange > 0
    ? `+${happinessChange}`
    : `${happinessChange}`
  const happinessColor = happinessChange > 0 ? '#4ade80' : happinessChange < 0 ? '#f87171' : '#94a3b8'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className="rounded-xl px-6 py-8 flex flex-col items-center gap-4"
        style={{
          background: `linear-gradient(135deg, #16213e, #0f3460)`,
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 40px ${bgAccent}`,
          minWidth: 280,
          maxWidth: 340,
        }}
      >
        {/* タイトル */}
        <div
          className="font-pixel"
          style={{
            fontSize: '1.2rem',
            color: titleColor,
            textShadow: `0 0 20px ${titleColor}`,
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>

        {/* メッセージ */}
        <div className="font-pixel text-center" style={{ fontSize: '0.7rem', color: '#e0e0e0' }}>
          {message}
        </div>

        {/* 結果ボード */}
        <div
          className="w-full rounded-lg px-4 py-3 flex flex-col gap-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex justify-between items-center">
            <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              EXP獲得
            </span>
            <span className="font-pixel" style={{ fontSize: '0.75rem', color: '#4fc3f7' }}>
              +{expGain}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              幸福度
            </span>
            <span className="font-pixel" style={{ fontSize: '0.75rem', color: happinessColor }}>
              {happinessLabel}
            </span>
          </div>
        </div>

        {/* 戻るボタン */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
          style={{
            fontSize: '0.75rem',
            background: `linear-gradient(135deg, ${titleColor}33, ${titleColor}22)`,
            border: `2px solid ${titleColor}66`,
            color: titleColor,
            boxShadow: `0 2px 12px ${titleColor}33`,
            letterSpacing: '0.05em',
          }}
        >
          戻る
        </button>
      </div>
    </div>
  )
}

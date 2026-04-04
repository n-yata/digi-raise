import { useState, useEffect } from 'react'
import type { Creature } from '../types/creature'
import type { BattleRole, CreatureSnapshot } from '../types/battle'
import { useBattleWebSocket } from '../hooks/useBattleWebSocket'
import { useBattleState } from '../hooks/useBattleState'

interface BattleLobbyScreenProps {
  creature: Creature
  onBattleStart: (role: BattleRole, opponentCreature: CreatureSnapshot, seed: number) => void
  onCancel: () => void
}

type LobbyTab = 'create' | 'join'

export default function BattleLobbyScreen({ creature, onBattleStart, onCancel }: BattleLobbyScreenProps) {
  const [tab, setTab] = useState<LobbyTab>('create')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [seed, setSeed] = useState<number | null>(null)
  const [battleRole, setBattleRole] = useState<BattleRole | null>(null)
  const [opponentSnapshot, setOpponentSnapshot] = useState<CreatureSnapshot | null>(null)

  const ws = useBattleWebSocket()
  const { state, processEvent } = useBattleState()

  // WebSocket接続
  useEffect(() => {
    ws.connect(creature).catch(() => {
      // ignore connection error
    })
    return () => {
      ws.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // イベント処理
  useEffect(() => {
    if (!ws.lastEvent) return
    processEvent(ws.lastEvent)

    const ev = ws.lastEvent
    if (ev.event === 'opponent_joined') {
      setOpponentSnapshot(ev.opponentCreature)
    }
    if (ev.event === 'battle_start') {
      setSeed(ev.seed)
      setBattleRole(ev.yourRole)
    }
  }, [ws.lastEvent, processEvent])

  // バトル開始トリガー
  useEffect(() => {
    if (seed !== null && battleRole !== null && opponentSnapshot !== null) {
      onBattleStart(battleRole, opponentSnapshot, seed)
    }
  }, [seed, battleRole, opponentSnapshot, onBattleStart])

  const handleCreateRoom = () => {
    ws.sendCreateRoom(creature)
  }

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return
    ws.sendJoinRoom(joinCode.trim().toUpperCase(), creature)
  }

  const handleReady = () => {
    if (!state.roomCode) return
    ws.sendReady(state.roomCode)
    setIsReady(true)
  }

  const handleCopyCode = () => {
    if (!state.roomCode) return
    navigator.clipboard.writeText(state.roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleCancel = () => {
    if (state.roomCode) {
      ws.sendLeaveRoom(state.roomCode)
    }
    ws.disconnect()
    onCancel()
  }

  const opponentReady = state.phase === 'ready' || state.opponentCreature !== null
  const canStartReady = opponentReady && !isReady && state.roomCode !== null

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: '#1a1a2e', maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #0f346044' }}>
        <div className="flex items-center justify-between">
          <div className="font-pixel" style={{ fontSize: '0.7rem', color: '#4fc3f7' }}>
            ⚔️ バトルロビー
          </div>
          <button
            onClick={handleCancel}
            className="font-pixel px-3 py-1 rounded transition-all active:scale-95"
            style={{
              fontSize: '0.45rem',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid #f8717166',
              color: '#f87171',
            }}
          >
            キャンセル
          </button>
        </div>
        {/* 接続状態 */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: ws.isConnected ? '#4ade80' : '#f87171',
              boxShadow: ws.isConnected ? '0 0 6px #4ade80' : 'none',
            }}
          />
          <span className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>
            {ws.isConnected ? '接続済み' : '接続中...'}
          </span>
        </div>
      </div>

      {/* 自分のクリーチャー情報 */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-1" style={{ fontSize: '0.45rem', color: '#64748b' }}>
          あなたのクリーチャー
        </div>
        <div className="flex justify-between items-center">
          <span className="font-pixel" style={{ fontSize: '0.6rem', color: '#e0e0e0' }}>
            {creature.name}
          </span>
          <div className="flex gap-3">
            {[
              { label: 'HP', value: creature.hp },
              { label: 'ATK', value: creature.atk },
              { label: 'DEF', value: creature.def },
              { label: 'SPD', value: creature.spd },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="font-pixel" style={{ fontSize: '0.35rem', color: '#64748b' }}>{label}</span>
                <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#4fc3f7' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        {(['create', 'join'] as LobbyTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="py-2 font-pixel transition-all"
            style={{
              fontSize: '0.45rem',
              background: tab === t ? '#0f3460' : 'transparent',
              color: tab === t ? '#4fc3f7' : '#64748b',
              border: 'none',
            }}
          >
            {t === 'create' ? 'ルーム作成' : 'ルームに参加'}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="mx-4 mt-3 flex-1">
        {tab === 'create' && (
          <div className="flex flex-col gap-3">
            {!state.roomCode ? (
              <button
                onClick={handleCreateRoom}
                disabled={!ws.isConnected}
                className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
                style={{
                  fontSize: '0.55rem',
                  background: ws.isConnected ? 'linear-gradient(135deg, #4fc3f733, #4fc3f711)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${ws.isConnected ? '#4fc3f766' : 'rgba(255,255,255,0.1)'}`,
                  color: ws.isConnected ? '#4fc3f7' : '#64748b',
                  opacity: ws.isConnected ? 1 : 0.5,
                  cursor: ws.isConnected ? 'pointer' : 'not-allowed',
                }}
              >
                ルームを作成する
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {/* ルームコード */}
                <div className="px-4 py-3 rounded-lg" style={{ background: '#16213e', border: '1px solid #4fc3f744' }}>
                  <div className="font-pixel mb-1" style={{ fontSize: '0.4rem', color: '#64748b' }}>
                    ルームコード
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel" style={{ fontSize: '0.9rem', color: '#ffd700', letterSpacing: '0.1em' }}>
                      {state.roomCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 rounded font-pixel transition-all active:scale-95"
                      style={{
                        fontSize: '0.4rem',
                        background: copied ? '#4ade8033' : '#16213e',
                        border: `1px solid ${copied ? '#4ade80' : '#0f3460'}`,
                        color: copied ? '#4ade80' : '#4fc3f7',
                      }}
                    >
                      {copied ? 'コピー済！' : 'コピー'}
                    </button>
                  </div>
                </div>

                {/* 相手の状態 */}
                <div
                  className="px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ background: '#16213e', border: `1px solid ${opponentReady ? '#4ade8044' : '#0f3460'}` }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: opponentReady ? '#4ade80' : '#64748b',
                      boxShadow: opponentReady ? '0 0 6px #4ade80' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span className="font-pixel" style={{ fontSize: '0.45rem', color: opponentReady ? '#4ade80' : '#64748b' }}>
                    {opponentReady ? `${state.opponentCreature?.name ?? '相手'}が参加！` : '相手を待っています...'}
                  </span>
                </div>

                {/* バトル開始ボタン */}
                {canStartReady && (
                  <button
                    onClick={handleReady}
                    className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
                    style={{
                      fontSize: '0.55rem',
                      background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
                      backgroundSize: '200% 100%',
                      border: '2px solid #ffd700',
                      color: '#111',
                      boxShadow: '0 0 20px #ffd70088',
                    }}
                  >
                    ⚔️ バトル開始！
                  </button>
                )}
                {isReady && (
                  <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#ffd700' }}>
                    バトル開始を待っています...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>
                ルームコード
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="例: AB1234"
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg font-pixel"
                style={{
                  fontSize: '0.65rem',
                  background: '#16213e',
                  border: '1px solid #0f3460',
                  color: '#e0e0e0',
                  outline: 'none',
                  letterSpacing: '0.1em',
                }}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={!ws.isConnected || joinCode.trim().length < 4}
              className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
              style={{
                fontSize: '0.55rem',
                background: ws.isConnected && joinCode.trim().length >= 4
                  ? 'linear-gradient(135deg, #4fc3f733, #4fc3f711)'
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${ws.isConnected && joinCode.trim().length >= 4 ? '#4fc3f766' : 'rgba(255,255,255,0.1)'}`,
                color: ws.isConnected && joinCode.trim().length >= 4 ? '#4fc3f7' : '#64748b',
                opacity: ws.isConnected && joinCode.trim().length >= 4 ? 1 : 0.5,
                cursor: ws.isConnected && joinCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
              }}
            >
              参加する
            </button>

            {/* 参加後のready */}
            {state.roomCode && tab === 'join' && !isReady && (
              <button
                onClick={handleReady}
                className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
                style={{
                  fontSize: '0.55rem',
                  background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
                  backgroundSize: '200% 100%',
                  border: '2px solid #ffd700',
                  color: '#111',
                  boxShadow: '0 0 20px #ffd70088',
                }}
              >
                ⚔️ バトル準備完了！
              </button>
            )}
          </div>
        )}

        {/* エラー */}
        {state.error && (
          <div
            className="mt-3 px-3 py-2 rounded-lg font-pixel"
            style={{ fontSize: '0.45rem', background: 'rgba(248,113,113,0.1)', border: '1px solid #f8717166', color: '#f87171' }}
          >
            {state.error}
          </div>
        )}
      </div>
    </div>
  )
}

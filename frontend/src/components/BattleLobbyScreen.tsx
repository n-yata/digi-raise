import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react'
import DOMPurify from 'dompurify'
import type { Creature } from '../types/creature'
import type { BattleRole, CreatureSnapshot } from '../types/battle'
import { generateCpuCreature } from '../utils/cpuBattle'
import QRCreatureScan from './QRCreatureScan'
import type { UseBattleWebSocketReturn } from '../hooks/useBattleWebSocket'

interface LobbyCallbacks {
  onRoomCreated: (roomCode: string) => void
  onOpponentJoined: (opponentCreature: CreatureSnapshot) => void
  onBattleStart: (seed: number, role: BattleRole) => void
  onError: (code: string, message: string) => void
  onOpponentLeft: () => void
  onOpponentDisconnected: (timeoutSec: number) => void
}

interface BattleLobbyScreenProps {
  creature: Creature
  onCpuBattleStart: (opponentCreature: CreatureSnapshot, seed: number) => void
  onQrBattleStart: (opponentCreature: CreatureSnapshot, seed: number) => void
  onOnlineBattleReady: (opponent: CreatureSnapshot, role: BattleRole, seed: number, roomCode: string) => void
  onCancel: () => void
  onlineWs: UseBattleWebSocketReturn
  onlineLobbyCallbacksRef: MutableRefObject<LobbyCallbacks | null>
}

type LobbyTab = 'cpu' | 'qr' | 'online'
type OnlineState = 'idle' | 'connecting' | 'waiting_for_opponent' | 'ready'

export default function BattleLobbyScreen({
  creature,
  onCpuBattleStart,
  onQrBattleStart,
  onOnlineBattleReady,
  onCancel,
  onlineWs,
  onlineLobbyCallbacksRef,
}: BattleLobbyScreenProps) {
  const [tab, setTab] = useState<LobbyTab>('cpu')
  const [cpuOpponent, setCpuOpponent] = useState<CreatureSnapshot | null>(null)

  // オンライン対戦 state
  const [onlineState, setOnlineState] = useState<OnlineState>('idle')
  const [roomCode, setRoomCode] = useState<string>('')
  const [joinCodeInput, setJoinCodeInput] = useState<string>('')
  const [onlineError, setOnlineError] = useState<string | null>(null)

  // バトル開始に必要なデータを ref で保持
  const pendingOpponentRef = useRef<CreatureSnapshot | null>(null)
  const pendingBattleRoleRef = useRef<BattleRole | null>(null)
  const pendingBattleSeedRef = useRef<number | null>(null)
  const roomCodeRef = useRef<string>('')

  // roomCode が変わったら ref も同期
  useEffect(() => {
    roomCodeRef.current = roomCode
  }, [roomCode])

  const tryTransitionToBattle = useCallback(() => {
    const opponent = pendingOpponentRef.current
    const role = pendingBattleRoleRef.current
    const seed = pendingBattleSeedRef.current
    const code = roomCodeRef.current
    if (opponent && role && seed !== null && code) {
      onOnlineBattleReady(opponent, role, seed, code)
    }
  }, [onOnlineBattleReady])

  // App.tsx の ws コールバック ref にロビーのコールバックを登録
  useEffect(() => {
    onlineLobbyCallbacksRef.current = {
      onRoomCreated: (code: string) => {
        setRoomCode(code)
        roomCodeRef.current = code
        setOnlineState('waiting_for_opponent')
        setOnlineError(null)
      },
      onOpponentJoined: (opponentCreature: CreatureSnapshot) => {
        // サーバーから来る customSprites を customSvg に変換
        const raw = opponentCreature as CreatureSnapshot & { customSprites?: Record<string, string> }
        if (raw.customSprites && !raw.customSvg) {
          const svg = raw.customSprites[String(raw.evolutionStage)]
          raw.customSvg = svg ? DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) : undefined
        }
        pendingOpponentRef.current = raw
        setOnlineState('ready')
        tryTransitionToBattle()
      },
      onBattleStart: (seed: number, role: BattleRole) => {
        pendingBattleRoleRef.current = role
        pendingBattleSeedRef.current = seed
        tryTransitionToBattle()
      },
      onError: (_code: string, message: string) => {
        setOnlineError(message)
        setOnlineState('idle')
      },
      onOpponentLeft: () => {
        setOnlineError('相手が退出しました')
        setOnlineState('idle')
      },
      onOpponentDisconnected: () => {
        setOnlineError('相手が切断しました')
        setOnlineState('idle')
      },
    }

    return () => {
      onlineLobbyCallbacksRef.current = null
    }
  }, [onlineLobbyCallbacksRef, tryTransitionToBattle])

  // CPU対戦相手を生成
  useEffect(() => {
    const playerSnapshot: CreatureSnapshot = {
      name: creature.name,
      evolutionStage: creature.evolutionStage,
      type: creature.type,
      hp: creature.hp,
      maxHp: creature.maxHp,
      atk: creature.atk,
      def: creature.def,
      spd: creature.spd,
      level: creature.level,
    }
    setCpuOpponent(generateCpuCreature(playerSnapshot))
  }, [creature])

  // opponent が参加したら ready を送信（HostがReadyを送る）
  useEffect(() => {
    if (onlineState === 'ready' && roomCodeRef.current) {
      onlineWs.sendReady(roomCodeRef.current)
    }
  }, [onlineState, onlineWs])

  const handleRegenerateCpu = () => {
    const playerSnapshot: CreatureSnapshot = {
      name: creature.name,
      evolutionStage: creature.evolutionStage,
      type: creature.type,
      hp: creature.hp,
      maxHp: creature.maxHp,
      atk: creature.atk,
      def: creature.def,
      spd: creature.spd,
      level: creature.level,
    }
    setCpuOpponent(generateCpuCreature(playerSnapshot))
  }

  const handleCpuBattleStart = () => {
    if (!cpuOpponent) return
    onCpuBattleStart(cpuOpponent, Date.now())
  }

  const handleQrOpponentScanned = (opponent: CreatureSnapshot) => {
    onQrBattleStart(opponent, Date.now())
  }

  // オンライン対戦: ルーム作成
  const handleCreateRoom = useCallback(async () => {
    setOnlineError(null)
    setOnlineState('connecting')
    try {
      await onlineWs.connect()
      onlineWs.createRoom(creature)
    } catch {
      setOnlineError('接続に失敗しました。もう一度お試しください。')
      setOnlineState('idle')
    }
  }, [onlineWs, creature])

  // オンライン対戦: ルーム参加
  const handleJoinRoom = useCallback(async () => {
    const code = joinCodeInput.trim().toUpperCase()
    if (!code) return
    setOnlineError(null)
    setOnlineState('connecting')
    try {
      await onlineWs.connect()
      setRoomCode(code)
      roomCodeRef.current = code
      onlineWs.joinRoom(code, creature)
    } catch {
      setOnlineError('接続に失敗しました。もう一度お試しください。')
      setOnlineState('idle')
    }
  }, [onlineWs, joinCodeInput, creature])

  // オンライン対戦: キャンセル
  const handleOnlineCancel = useCallback(() => {
    if (roomCodeRef.current) {
      onlineWs.leaveRoom(roomCodeRef.current)
    }
    onlineWs.disconnect()
    setOnlineState('idle')
    setRoomCode('')
    roomCodeRef.current = ''
    setJoinCodeInput('')
    setOnlineError(null)
    pendingOpponentRef.current = null
    pendingBattleRoleRef.current = null
    pendingBattleSeedRef.current = null
  }, [onlineWs])

  const mySnapshot: CreatureSnapshot = {
    name: creature.name,
    evolutionStage: creature.evolutionStage,
    type: creature.type,
    hp: creature.hp,
    maxHp: creature.maxHp,
    atk: creature.atk,
    def: creature.def,
    spd: creature.spd,
    level: creature.level,
  }

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: '#1a1a2e', maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #0f346044' }}>
        <div className="flex items-center justify-between">
          <div className="font-pixel" style={{ fontSize: '1rem', color: '#4fc3f7' }}>
            バトルロビー
          </div>
          <button
            onClick={onCancel}
            className="font-pixel px-3 py-1 rounded transition-all active:scale-95"
            style={{
              fontSize: '0.65rem',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid #f8717166',
              color: '#f87171',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>

      {/* 自分のクリーチャー情報 */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-1" style={{ fontSize: '0.65rem', color: '#64748b' }}>
          あなたのクリーチャー
        </div>
        <div className="flex justify-between items-center">
          <span className="font-pixel" style={{ fontSize: '0.7rem', color: '#e0e0e0' }}>
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
                <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</span>
                <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#4fc3f7' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div
        className="mx-4 mt-3 grid grid-cols-3 gap-1 rounded-lg overflow-hidden"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        {(['cpu', 'qr', 'online'] as LobbyTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="py-2 font-pixel transition-all"
            style={{
              fontSize: '0.6rem',
              background: tab === t ? '#0f3460' : 'transparent',
              color: tab === t ? '#4fc3f7' : '#64748b',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t === 'cpu' ? 'CPU対戦' : t === 'qr' ? 'QR対戦' : 'オンライン'}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="mx-4 mt-3 flex-1">
        {/* CPU対戦 */}
        {tab === 'cpu' && cpuOpponent && (
          <div className="flex flex-col gap-3">
            <div className="px-3 py-3 rounded-lg" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
              <div className="font-pixel mb-2" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                対戦相手（CPU）
              </div>
              <div className="flex justify-between items-center">
                <span className="font-pixel" style={{ fontSize: '0.7rem', color: '#e0e0e0' }}>
                  {cpuOpponent.name}
                </span>
                <div className="flex gap-3">
                  {[
                    { label: 'HP', value: cpuOpponent.maxHp },
                    { label: 'ATK', value: cpuOpponent.atk },
                    { label: 'DEF', value: cpuOpponent.def },
                    { label: 'SPD', value: cpuOpponent.spd },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</span>
                      <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#4fc3f7' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="font-pixel mt-2" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                タイプ: {cpuOpponent.type} / Lv.{cpuOpponent.level}
              </div>
            </div>

            <button
              onClick={handleRegenerateCpu}
              className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95"
              style={{
                fontSize: '0.65rem',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid #64748b44',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              対戦相手を変更
            </button>

            <button
              onClick={handleCpuBattleStart}
              className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
              style={{
                fontSize: '0.75rem',
                background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
                backgroundSize: '200% 100%',
                border: '2px solid #ffd700',
                color: '#111',
                boxShadow: '0 0 20px #ffd70088',
                cursor: 'pointer',
              }}
            >
              CPUバトル開始！
            </button>
          </div>
        )}

        {/* QR対戦 */}
        {tab === 'qr' && (
          <QRCreatureScan
            myCreature={mySnapshot}
            onOpponentScanned={handleQrOpponentScanned}
            onCancel={() => setTab('cpu')}
          />
        )}

        {/* オンライン対戦 */}
        {tab === 'online' && (
          <div className="flex flex-col gap-3">
            {/* エラー表示 */}
            {onlineError && (
              <div
                className="px-3 py-2 rounded-lg font-pixel"
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid #f8717166',
                  color: '#f87171',
                }}
              >
                {onlineError}
              </div>
            )}

            {/* idle: ルーム作成 or 参加 */}
            {onlineState === 'idle' && (
              <>
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
                  style={{
                    fontSize: '0.7rem',
                    background: 'linear-gradient(90deg, #4fc3f7, #0288d1)',
                    border: '2px solid #4fc3f7',
                    color: '#111',
                    boxShadow: '0 0 15px #4fc3f744',
                    cursor: 'pointer',
                  }}
                >
                  ルームを作成する
                </button>

                <div
                  className="px-3 py-3 rounded-lg flex flex-col gap-2"
                  style={{ background: '#16213e', border: '1px solid #0f3460' }}
                >
                  <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    ルームコードで参加
                  </div>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="例: ABC123"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded font-pixel"
                    style={{
                      fontSize: '0.75rem',
                      background: '#0f1a2d',
                      border: '1px solid #0f346066',
                      color: '#e0e0e0',
                      outline: 'none',
                      letterSpacing: '0.1em',
                    }}
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!joinCodeInput.trim()}
                    className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95"
                    style={{
                      fontSize: '0.65rem',
                      background: joinCodeInput.trim()
                        ? 'linear-gradient(90deg, #a78bfa, #7c3aed)'
                        : 'rgba(100,116,139,0.1)',
                      border: joinCodeInput.trim() ? '2px solid #a78bfa' : '1px solid #64748b44',
                      color: joinCodeInput.trim() ? '#fff' : '#64748b',
                      boxShadow: joinCodeInput.trim() ? '0 0 12px #a78bfa44' : 'none',
                      cursor: joinCodeInput.trim() ? 'pointer' : 'default',
                    }}
                  >
                    参加する
                  </button>
                </div>
              </>
            )}

            {/* connecting */}
            {onlineState === 'connecting' && (
              <div
                className="px-3 py-6 rounded-lg flex flex-col items-center gap-3"
                style={{ background: '#16213e', border: '1px solid #0f3460' }}
              >
                <div className="font-pixel animate-pulse" style={{ fontSize: '1.5rem' }}>
                  🌐
                </div>
                <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  接続中...
                </div>
              </div>
            )}

            {/* waiting_for_opponent */}
            {onlineState === 'waiting_for_opponent' && (
              <div
                className="px-3 py-5 rounded-lg flex flex-col items-center gap-3"
                style={{ background: '#16213e', border: '1px solid #0f3460' }}
              >
                <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  ルームコード
                </div>
                <div
                  className="font-pixel px-4 py-2 rounded"
                  style={{
                    fontSize: '1.4rem',
                    color: '#4fc3f7',
                    background: '#0f1a2d',
                    border: '2px solid #4fc3f766',
                    letterSpacing: '0.2em',
                  }}
                >
                  {roomCode}
                </div>
                <div className="font-pixel animate-pulse" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  相手を待っています...
                </div>
                <button
                  onClick={handleOnlineCancel}
                  className="mt-2 px-4 py-2 rounded-lg font-pixel transition-all active:scale-95"
                  style={{
                    fontSize: '0.6rem',
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid #f8717166',
                    color: '#f87171',
                    cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
              </div>
            )}

            {/* ready: バトル開始準備中 */}
            {onlineState === 'ready' && (
              <div
                className="px-3 py-6 rounded-lg flex flex-col items-center gap-3"
                style={{ background: '#16213e', border: '1px solid #0f3460' }}
              >
                <div className="font-pixel animate-pulse" style={{ fontSize: '1.5rem' }}>
                  ⚔️
                </div>
                <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#4fc3f7' }}>
                  相手が見つかりました！
                </div>
                <div className="font-pixel animate-pulse" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  バトル開始中...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useCallback, useEffect } from 'react'
import type { BattleAction, CreatureSnapshot, ServerEvent } from '../types/battle'
import type { P2PMessage } from '../types/p2pBattle'
import type { UseWebRTCReturn } from './useWebRTC'

const VALID_ACTIONS = new Set<string>(['attack', 'guard', 'special'])
const VALID_WINNERS = new Set<string>(['host', 'guest', 'draw'])
const VALID_MESSAGE_TYPES = new Set<string>([
  'creature_info', 'ready', 'battle_start', 'action_selected',
  'actions_locked', 'battle_end', 'ping', 'pong',
])
const MAX_MESSAGE_SIZE = 10000 // 10KB
const MESSAGE_MIN_INTERVAL = 50 // ms

/** 有限な数値であることを検証 */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v)
}

/** CreatureSnapshotのランタイムバリデーション */
function validateCreatureSnapshot(obj: unknown): CreatureSnapshot | null {
  if (typeof obj !== 'object' || obj === null) return null
  const c = obj as Record<string, unknown>

  if (typeof c.name !== 'string' || c.name.length === 0 || c.name.length > 50) return null
  if (!isFiniteNumber(c.evolutionStage) || c.evolutionStage < 0 || c.evolutionStage > 5) return null
  if (typeof c.type !== 'string') return null
  if (!isFiniteNumber(c.hp) || c.hp < 0 || c.hp > 9999) return null
  if (!isFiniteNumber(c.maxHp) || c.maxHp < 1 || c.maxHp > 9999) return null
  if (!isFiniteNumber(c.atk) || c.atk < 0 || c.atk > 9999) return null
  if (!isFiniteNumber(c.def) || c.def < 0 || c.def > 9999) return null
  if (!isFiniteNumber(c.spd) || c.spd < 0 || c.spd > 9999) return null

  // optionalフィールド
  if (c.level !== undefined && (!isFiniteNumber(c.level) || c.level < 1 || c.level > 999)) return null
  if (c.customSvg !== undefined && (typeof c.customSvg !== 'string' || c.customSvg.length > 100000)) return null

  return {
    name: c.name,
    evolutionStage: c.evolutionStage as number,
    type: c.type as string,
    hp: c.hp as number,
    maxHp: c.maxHp as number,
    atk: c.atk as number,
    def: c.def as number,
    spd: c.spd as number,
    level: c.level as number | undefined,
    customSvg: c.customSvg as string | undefined,
  }
}

/** 受信メッセージのランタイムバリデーション */
function validateMessage(data: string): P2PMessage | null {
  if (data.length > MAX_MESSAGE_SIZE) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const obj = parsed as Record<string, unknown>
  if (!VALID_MESSAGE_TYPES.has(obj.type as string)) return null

  switch (obj.type) {
    case 'creature_info': {
      const creature = validateCreatureSnapshot(obj.creature)
      if (!creature) return null
      return { type: 'creature_info', creature }
    }
    case 'ready':
      return { type: 'ready' }
    case 'battle_start':
      if (!isFiniteNumber(obj.seed)) return null
      return { type: 'battle_start', seed: obj.seed }
    case 'action_selected':
      if (!VALID_ACTIONS.has(obj.action as string)) return null
      return { type: 'action_selected', action: obj.action as BattleAction }
    case 'actions_locked':
      if (!VALID_ACTIONS.has(obj.hostAction as string)) return null
      if (!VALID_ACTIONS.has(obj.guestAction as string)) return null
      if (!isFiniteNumber(obj.seed)) return null
      return { type: 'actions_locked', hostAction: obj.hostAction as BattleAction, guestAction: obj.guestAction as BattleAction, seed: obj.seed }
    case 'battle_end':
      if (!VALID_WINNERS.has(obj.winner as string)) return null
      return { type: 'battle_end', winner: obj.winner as 'host' | 'guest' | 'draw' }
    case 'ping':
      return { type: 'ping' }
    case 'pong':
      return { type: 'pong' }
    default:
      return null
  }
}

export interface UseBattleP2PReturn {
  /** WebSocket版と同じインターフェース */
  isConnected: boolean
  lastEvent: ServerEvent | null
  /** P2P接続済みの状態でクリーチャー情報を送信し、バトル準備を開始する */
  startBattle: (myCreature: CreatureSnapshot) => void
  /** 準備完了を送信 */
  sendReady: () => void
  /** アクション選択を送信 */
  sendAction: (action: BattleAction) => void
  /** 切断 */
  disconnect: () => void
}

const PING_INTERVAL = 30000
const PING_TIMEOUT = 10000

/**
 * WebRTC DataChannel 上でバトルメッセージをやり取りするフック
 *
 * 内部で P2PMessage をやり取りし、外部には ServerEvent として公開することで、
 * 既存の BattleScreen / useBattleState との互換性を維持する。
 */
export function useBattleP2P(webrtc: UseWebRTCReturn): UseBattleP2PReturn {
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null)
  const isConnected = webrtc.connectionState === 'connected'

  const myCreatureRef = useRef<CreatureSnapshot | null>(null)
  const opponentCreatureRef = useRef<CreatureSnapshot | null>(null)
  const lastMessageTimeRef = useRef(0)
  const myReadyRef = useRef(false)
  const opponentReadyRef = useRef(false)
  const myActionRef = useRef<BattleAction | null>(null)
  const opponentActionRef = useRef<BattleAction | null>(null)
  const turnSeedRef = useRef(0)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHost = webrtc.role === 'host'

  /** P2Pメッセージを送信 */
  const sendP2P = useCallback((msg: P2PMessage) => {
    webrtc.send(JSON.stringify(msg))
  }, [webrtc])

  /** ホスト: シードを生成 */
  const generateSeed = useCallback(() => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0]
  }, [])

  /** ホスト: 両者のアクションが揃ったらactions_lockedを発行 */
  const tryLockActions = useCallback(() => {
    if (!isHost) return
    if (myActionRef.current === null || opponentActionRef.current === null) return

    const seed = generateSeed()
    const hostAction = myActionRef.current
    const guestAction = opponentActionRef.current

    // ホスト自身にもイベント発火
    setLastEvent({
      event: 'actions_locked',
      hostAction,
      guestAction,
      seed,
    })

    // ゲストにも送信
    sendP2P({
      type: 'actions_locked',
      hostAction,
      guestAction,
      seed,
    })

    // アクションをリセット
    myActionRef.current = null
    opponentActionRef.current = null
  }, [isHost, generateSeed, sendP2P])

  /** 受信メッセージを処理 */
  const handleMessage = useCallback((data: string) => {
    // レート制限
    const now = Date.now()
    if (now - lastMessageTimeRef.current < MESSAGE_MIN_INTERVAL) return
    lastMessageTimeRef.current = now

    // バリデーション
    const msg = validateMessage(data)
    if (!msg) return

    switch (msg.type) {
      case 'creature_info': {
        opponentCreatureRef.current = msg.creature
        if (isHost) {
          // ホスト: ゲストが参加した
          setLastEvent({
            event: 'opponent_joined',
            opponentCreature: msg.creature,
          })
        } else {
          // ゲスト: ホストの情報を受け取った → opponent_joinedとして扱う
          setLastEvent({
            event: 'opponent_joined',
            opponentCreature: msg.creature,
          })
        }
        break
      }

      case 'ready': {
        opponentReadyRef.current = true
        // 両者readyでバトル開始
        if (isHost && myReadyRef.current && opponentReadyRef.current) {
          const seed = generateSeed()
          turnSeedRef.current = seed

          // ゲストに開始通知
          sendP2P({ type: 'battle_start', seed })

          // ホスト自身にもイベント発火
          setLastEvent({
            event: 'battle_start',
            seed,
            yourRole: 'host',
          })
        }
        break
      }

      case 'battle_start': {
        // ゲスト側: ホストからバトル開始通知
        turnSeedRef.current = msg.seed
        setLastEvent({
          event: 'battle_start',
          seed: msg.seed,
          yourRole: 'guest',
        })
        break
      }

      case 'action_selected': {
        if (isHost) {
          // ホスト: ゲストのアクションを受信
          opponentActionRef.current = msg.action
          tryLockActions()
        } else {
          // ゲスト側ではaction_selectedは来ない（ホストがactions_lockedを送る）
        }
        break
      }

      case 'actions_locked': {
        // ゲスト側: ホストからのアクション確定通知
        // 自分が送ったアクションが改ざんされていないか検証
        if (!isHost && myActionRef.current !== null && msg.guestAction !== myActionRef.current) {
          // アクション改ざん検知 → 切断
          setLastEvent({ event: 'opponent_disconnected' })
          return
        }
        setLastEvent({
          event: 'actions_locked',
          hostAction: msg.hostAction,
          guestAction: msg.guestAction,
          seed: msg.seed,
        })
        // アクションリセット
        myActionRef.current = null
        opponentActionRef.current = null
        break
      }

      case 'battle_end': {
        setLastEvent({
          event: 'battle_end',
          winner: msg.winner,
        })
        break
      }

      case 'ping': {
        sendP2P({ type: 'pong' })
        break
      }

      case 'pong': {
        // タイムアウトクリア
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current)
          pingTimeoutRef.current = null
        }
        break
      }
    }
  }, [isHost, generateSeed, sendP2P, tryLockActions])

  // DataChannelのメッセージを監視
  useEffect(() => {
    if (webrtc.lastMessage !== null) {
      handleMessage(webrtc.lastMessage)
    }
  }, [webrtc.lastMessage, handleMessage])

  // 接続断を検知
  useEffect(() => {
    if (webrtc.connectionState === 'disconnected' || webrtc.connectionState === 'failed') {
      setLastEvent({ event: 'opponent_disconnected' })
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    }
  }, [webrtc.connectionState])

  // Keep-alive ping
  useEffect(() => {
    if (!isConnected) return

    pingIntervalRef.current = setInterval(() => {
      sendP2P({ type: 'ping' })

      // タイムアウト監視
      pingTimeoutRef.current = setTimeout(() => {
        setLastEvent({ event: 'opponent_disconnected' })
      }, PING_TIMEOUT)
    }, PING_INTERVAL)

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current)
        pingTimeoutRef.current = null
      }
    }
  }, [isConnected, sendP2P])

  /** バトル準備開始: クリーチャー情報を送信 */
  const startBattle = useCallback((myCreature: CreatureSnapshot) => {
    myCreatureRef.current = myCreature
    sendP2P({ type: 'creature_info', creature: myCreature })
  }, [sendP2P])

  /** アクション選択を送信 */
  const sendAction = useCallback((action: BattleAction) => {
    myActionRef.current = action

    if (isHost) {
      // ホスト: 自分のアクションをセットしてロック判定
      tryLockActions()
    } else {
      // ゲスト: ホストに送信
      sendP2P({ type: 'action_selected', action })
    }
  }, [isHost, sendP2P, tryLockActions])

  /** 準備完了を送信 */
  const sendReady = useCallback(() => {
    myReadyRef.current = true
    sendP2P({ type: 'ready' })

    // ホスト: 両者ready判定
    if (isHost && opponentReadyRef.current) {
      const seed = generateSeed()
      turnSeedRef.current = seed
      sendP2P({ type: 'battle_start', seed })
      setLastEvent({
        event: 'battle_start',
        seed,
        yourRole: 'host',
      })
    }
  }, [isHost, generateSeed, sendP2P])

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    webrtc.close()
  }, [webrtc])

  return {
    isConnected,
    lastEvent,
    startBattle,
    sendAction,
    sendReady,
    disconnect,
  }
}

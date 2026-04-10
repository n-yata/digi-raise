import { useRef, useCallback, useState, useEffect } from 'react'
import type { BattleAction, BattleRole, CreatureSnapshot } from '../types/battle'
import type { Creature } from '../types/creature'
import { generateWsToken } from '../utils/wsToken'

const WS_ENDPOINT = 'wss://<REDACTED>.execute-api.ap-northeast-1.amazonaws.com/prod'
const PING_INTERVAL_MS = 30000
const RECONNECT_TOKEN_KEY = 'ws_reconnect_token'

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export interface UseBattleWebSocketOptions {
  onRoomCreated: (roomCode: string) => void
  onOpponentJoined: (opponentCreature: CreatureSnapshot) => void
  onBattleStart: (seed: number, role: BattleRole) => void
  onActionsLocked: (hostAction: string, guestAction: string, seed: number, turnNumber: number) => void
  onBattleEnd: (winner: string) => void
  onOpponentDisconnected: (timeoutSec: number) => void
  onReconnected: (role: string) => void
  onOpponentLeft: () => void
  onError: (code: string, message: string) => void
}

export interface UseBattleWebSocketReturn {
  connect: () => Promise<void>
  disconnect: () => void
  createRoom: (creature: Creature) => void
  joinRoom: (roomCode: string, creature: Creature) => void
  sendReady: (roomCode: string) => void
  selectAction: (roomCode: string, action: BattleAction) => void
  leaveRoom: (roomCode: string) => void
  isConnected: boolean
}

export function useBattleWebSocket(options: UseBattleWebSocketOptions): UseBattleWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // オプションを ref で保持（再接続時も最新のコールバックを参照するため）
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const reconnectAttemptRef = useRef(0)
  const intentionalCloseRef = useRef(false)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPingTimer = useCallback(() => {
    if (pingTimerRef.current !== null) {
      clearInterval(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }, [])

  const sendJson = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const startPing = useCallback(() => {
    clearPingTimer()
    pingTimerRef.current = setInterval(() => {
      sendJson({ action: 'ping' })
    }, PING_INTERVAL_MS)
  }, [clearPingTimer, sendJson])

  const handleMessage = useCallback((event: MessageEvent) => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(event.data as string) as Record<string, unknown>
    } catch {
      return
    }

    const evt = parsed.event as string | undefined

    switch (evt) {
      case 'room_created':
        optionsRef.current.onRoomCreated(parsed.roomCode as string)
        break

      case 'opponent_joined':
        optionsRef.current.onOpponentJoined(parsed.opponentCreature as CreatureSnapshot)
        break

      case 'battle_start':
        optionsRef.current.onBattleStart(parsed.seed as number, parsed.yourRole as BattleRole)
        break

      case 'actions_locked':
        optionsRef.current.onActionsLocked(
          parsed.hostAction as string,
          parsed.guestAction as string,
          parsed.seed as number,
          parsed.turnNumber as number
        )
        break

      case 'battle_end':
        optionsRef.current.onBattleEnd(parsed.winner as string)
        break

      case 'opponent_disconnected':
        optionsRef.current.onOpponentDisconnected(parsed.timeoutSec as number)
        break

      case 'reconnected':
        if (parsed.reconnectToken) {
          sessionStorage.setItem(RECONNECT_TOKEN_KEY, parsed.reconnectToken as string)
        }
        optionsRef.current.onReconnected(parsed.role as string)
        break

      case 'opponent_left':
        optionsRef.current.onOpponentLeft()
        break

      case 'room_left':
        // サーバー側で部屋を退出完了
        break

      case 'error':
        optionsRef.current.onError(parsed.code as string, parsed.message as string)
        break

      case 'pong':
        // ping への応答、何もしない
        break

      default:
        break
    }
  }, [])

  const connectInternal = useCallback(async (isReconnect: boolean): Promise<void> => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return
    }

    const token = await generateWsToken()
    const reconnectToken = sessionStorage.getItem(RECONNECT_TOKEN_KEY)

    let url = `${WS_ENDPOINT}?token=${token}`
    if (isReconnect && reconnectToken) {
      url += `&reconnectToken=${encodeURIComponent(reconnectToken)}`
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        reconnectAttemptRef.current = 0
        setIsConnected(true)
        startPing()
        resolve()
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        // onclose が続けて発火するため、ここでは reject のみ
        reject(new Error('WebSocket error'))
      }

      ws.onclose = (closeEvent) => {
        clearPingTimer()
        setIsConnected(false)
        wsRef.current = null

        // 正常切断（code=1000）または意図的クローズは再接続しない
        if (intentionalCloseRef.current || closeEvent.code === 1000) {
          intentionalCloseRef.current = false
          return
        }

        // 指数バックオフ再接続
        const attempt = reconnectAttemptRef.current
        const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)]
        reconnectAttemptRef.current++

        setTimeout(() => {
          connectInternal(true).catch(() => {
            // 再接続失敗は次の onclose で再試行
          })
        }, delay)
      }
    })
  }, [handleMessage, startPing, clearPingTimer])

  const connect = useCallback(async (): Promise<void> => {
    intentionalCloseRef.current = false
    reconnectAttemptRef.current = 0
    await connectInternal(false)
  }, [connectInternal])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    clearPingTimer()
    if (wsRef.current) {
      wsRef.current.close(1000, 'intentional')
      wsRef.current = null
    }
    setIsConnected(false)
    sessionStorage.removeItem(RECONNECT_TOKEN_KEY)
  }, [clearPingTimer])

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true
      clearPingTimer()
      if (wsRef.current) {
        wsRef.current.close(1000, 'unmount')
        wsRef.current = null
      }
    }
  }, [clearPingTimer])

  const createRoom = useCallback((creature: Creature) => {
    // customSprites を除外してデータ量を削減
    const { customSprites: _customSprites, ...creatureWithoutSprites } = creature
    sendJson({ action: 'create_room', creature: creatureWithoutSprites })
  }, [sendJson])

  const joinRoom = useCallback((roomCode: string, creature: Creature) => {
    const { customSprites: _customSprites, ...creatureWithoutSprites } = creature
    sendJson({ action: 'join_room', roomCode, creature: creatureWithoutSprites })
  }, [sendJson])

  const sendReady = useCallback((roomCode: string) => {
    sendJson({ action: 'ready', roomCode })
  }, [sendJson])

  const selectAction = useCallback((roomCode: string, action: BattleAction) => {
    sendJson({ action: 'select_action', roomCode, battleAction: action })
  }, [sendJson])

  const leaveRoom = useCallback((roomCode: string) => {
    sendJson({ action: 'leave_room', roomCode })
  }, [sendJson])

  return {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    sendReady,
    selectAction,
    leaveRoom,
    isConnected,
  }
}

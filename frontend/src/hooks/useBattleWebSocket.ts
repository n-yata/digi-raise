import { useState, useRef, useCallback, useEffect } from 'react'
import type { Creature } from '../types/creature'
import type { BattleAction, ServerEvent } from '../types/battle'
import { generateWsToken } from '../utils/wsToken'

export interface UseBattleWebSocketReturn {
  isConnected: boolean
  connect: (creature: Creature) => Promise<void>
  disconnect: () => void
  sendCreateRoom: (creature: Creature) => void
  sendJoinRoom: (roomCode: string, creature: Creature) => void
  sendReady: (roomCode: string) => void
  sendAction: (roomCode: string, action: BattleAction) => void
  sendPing: () => void
  sendLeaveRoom: (roomCode: string) => void
  lastEvent: ServerEvent | null
}

const MAX_RECONNECT = 3
const PING_INTERVAL = 30000
const RECONNECT_DELAY = 5000

export function useBattleWebSocket(): UseBattleWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCreatureRef = useRef<Creature | null>(null)
  const intentionalDisconnectRef = useRef(false)

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current !== null) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const connect = useCallback(async (_creature: Creature) => {
    lastCreatureRef.current = _creature
    intentionalDisconnectRef.current = false

    const wsUrl = import.meta.env.VITE_WS_URL ?? 'wss://localhost:8080'
    const { token, ts } = await generateWsToken()
    const url = `${wsUrl}?token=${token}&ts=${ts}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      reconnectCountRef.current = 0

      pingIntervalRef.current = setInterval(() => {
        sendMessage({ action: 'ping' })
      }, PING_INTERVAL)
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as ServerEvent
        setLastEvent(parsed)
      } catch {
        // ignore parse error
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      clearPingInterval()

      if (!intentionalDisconnectRef.current && reconnectCountRef.current < MAX_RECONNECT) {
        reconnectCountRef.current++
        reconnectTimeoutRef.current = setTimeout(() => {
          if (lastCreatureRef.current) {
            connect(lastCreatureRef.current).catch(() => {
              // ignore
            })
          }
        }, RECONNECT_DELAY)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [clearPingInterval, sendMessage])

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true
    clearPingInterval()
    clearReconnectTimeout()
    wsRef.current?.close()
    wsRef.current = null
    setIsConnected(false)
  }, [clearPingInterval, clearReconnectTimeout])

  const sendCreateRoom = useCallback((creature: Creature) => {
    sendMessage({
      action: 'create_room',
      creature: {
        name: creature.name,
        evolutionStage: creature.evolutionStage,
        type: creature.type,
        hp: creature.hp,
        maxHp: creature.maxHp,
        atk: creature.atk,
        def: creature.def,
        spd: creature.spd,
        level: creature.level,
      },
    })
  }, [sendMessage])

  const sendJoinRoom = useCallback((roomCode: string, creature: Creature) => {
    sendMessage({
      action: 'join_room',
      roomCode,
      creature: {
        name: creature.name,
        evolutionStage: creature.evolutionStage,
        type: creature.type,
        hp: creature.hp,
        maxHp: creature.maxHp,
        atk: creature.atk,
        def: creature.def,
        spd: creature.spd,
        level: creature.level,
      },
    })
  }, [sendMessage])

  const sendReady = useCallback((roomCode: string) => {
    sendMessage({ action: 'ready', roomCode })
  }, [sendMessage])

  const sendAction = useCallback((roomCode: string, action: BattleAction) => {
    sendMessage({ action: 'select_action', roomCode, battleAction: action })
  }, [sendMessage])

  const sendPing = useCallback(() => {
    sendMessage({ action: 'ping' })
  }, [sendMessage])

  const sendLeaveRoom = useCallback((roomCode: string) => {
    sendMessage({ action: 'leave_room', roomCode })
  }, [sendMessage])

  // クリーンアップ
  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true
      clearPingInterval()
      clearReconnectTimeout()
      wsRef.current?.close()
    }
  }, [clearPingInterval, clearReconnectTimeout])

  return {
    isConnected,
    connect,
    disconnect,
    sendCreateRoom,
    sendJoinRoom,
    sendReady,
    sendAction,
    sendPing,
    sendLeaveRoom,
    lastEvent,
  }
}

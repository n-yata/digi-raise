import { useReducer, useCallback } from 'react'
import type {
  BattleState,
  BattleAction,
  BattlePhase,
  BattleRole,
  CreatureSnapshot,
  ServerEvent,
} from '../types/battle'

const initialState: BattleState = {
  phase: 'waiting',
  roomCode: null,
  role: null,
  myCreature: null,
  opponentCreature: null,
  currentTurn: 0,
  myAction: null,
  opponentAction: null,
  specialCooldown: 0,
  myPoisonTurns: 0,
  opponentPoisonTurns: 0,
  myParalyzed: false,
  myDefBuff: 0,
  battleLog: [],
  winner: null,
  error: null,
}

type BattleReducerAction =
  | { type: 'SET_PHASE'; payload: BattlePhase }
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_ROLE'; payload: BattleRole }
  | { type: 'SET_MY_CREATURE'; payload: CreatureSnapshot }
  | { type: 'SET_OPPONENT_CREATURE'; payload: CreatureSnapshot }
  | { type: 'SET_MY_ACTION'; payload: BattleAction }
  | { type: 'SET_OPPONENT_ACTION'; payload: BattleAction }
  | { type: 'INCREMENT_TURN' }
  | { type: 'SET_SPECIAL_COOLDOWN'; payload: number }
  | { type: 'SET_MY_POISON_TURNS'; payload: number }
  | { type: 'SET_OPPONENT_POISON_TURNS'; payload: number }
  | { type: 'SET_MY_PARALYZED'; payload: boolean }
  | { type: 'SET_MY_DEF_BUFF'; payload: number }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'SET_WINNER'; payload: 'me' | 'opponent' | 'draw' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'UPDATE_MY_HP'; payload: number }
  | { type: 'UPDATE_OPPONENT_HP'; payload: number }
  | { type: 'CLEAR_ACTIONS' }
  | { type: 'RESET' }

function reducer(state: BattleState, action: BattleReducerAction): BattleState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload }
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload }
    case 'SET_ROLE':
      return { ...state, role: action.payload }
    case 'SET_MY_CREATURE':
      return { ...state, myCreature: action.payload }
    case 'SET_OPPONENT_CREATURE':
      return { ...state, opponentCreature: action.payload }
    case 'SET_MY_ACTION':
      return { ...state, myAction: action.payload }
    case 'SET_OPPONENT_ACTION':
      return { ...state, opponentAction: action.payload }
    case 'INCREMENT_TURN':
      return { ...state, currentTurn: state.currentTurn + 1 }
    case 'SET_SPECIAL_COOLDOWN':
      return { ...state, specialCooldown: action.payload }
    case 'SET_MY_POISON_TURNS':
      return { ...state, myPoisonTurns: action.payload }
    case 'SET_OPPONENT_POISON_TURNS':
      return { ...state, opponentPoisonTurns: action.payload }
    case 'SET_MY_PARALYZED':
      return { ...state, myParalyzed: action.payload }
    case 'SET_MY_DEF_BUFF':
      return { ...state, myDefBuff: action.payload }
    case 'ADD_LOG': {
      const logs = [...state.battleLog, action.payload]
      return { ...state, battleLog: logs.slice(-20) }
    }
    case 'SET_WINNER':
      return { ...state, winner: action.payload, phase: 'finished' }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'UPDATE_MY_HP':
      if (!state.myCreature) return state
      return { ...state, myCreature: { ...state.myCreature, hp: action.payload } }
    case 'UPDATE_OPPONENT_HP':
      if (!state.opponentCreature) return state
      return { ...state, opponentCreature: { ...state.opponentCreature, hp: action.payload } }
    case 'CLEAR_ACTIONS':
      return { ...state, myAction: null, opponentAction: null }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useBattleState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const processEvent = useCallback((event: ServerEvent) => {
    switch (event.event) {
      case 'battle_start':
        dispatch({ type: 'SET_ROLE', payload: event.yourRole })
        dispatch({ type: 'SET_PHASE', payload: 'selecting' })
        dispatch({ type: 'ADD_LOG', payload: 'バトル開始！' })
        break

      case 'turn_resolved':
        dispatch({ type: 'INCREMENT_TURN' })
        dispatch({ type: 'CLEAR_ACTIONS' })
        dispatch({ type: 'SET_PHASE', payload: 'selecting' })
        if (state.specialCooldown > 0) {
          dispatch({ type: 'SET_SPECIAL_COOLDOWN', payload: state.specialCooldown - 1 })
        }
        break

      case 'battle_end': {
        const winner = event.winner === 'draw'
          ? 'draw'
          : (event.winner === 'host') === (state.role === 'host')
            ? 'me'
            : 'opponent'
        dispatch({ type: 'SET_WINNER', payload: winner })
        break
      }

      case 'error':
        dispatch({ type: 'SET_ERROR', payload: event.message })
        break

      default:
        break
    }
  }, [state.role, state.specialCooldown])

  const selectAction = useCallback((action: BattleAction) => {
    dispatch({ type: 'SET_MY_ACTION', payload: action })
    if (action === 'special') {
      dispatch({ type: 'SET_SPECIAL_COOLDOWN', payload: 3 })
    }
  }, [])

  const addLog = useCallback((msg: string) => {
    dispatch({ type: 'ADD_LOG', payload: msg })
  }, [])

  const updateHp = useCallback((myHp: number, opponentHp: number) => {
    dispatch({ type: 'UPDATE_MY_HP', payload: myHp })
    dispatch({ type: 'UPDATE_OPPONENT_HP', payload: opponentHp })
  }, [])

  const updateEffects = useCallback((effects: {
    myPoisonTurns: number
    opponentPoisonTurns: number
    myParalyzed: boolean
    myDefBuff: number
  }) => {
    dispatch({ type: 'SET_MY_POISON_TURNS', payload: effects.myPoisonTurns })
    dispatch({ type: 'SET_OPPONENT_POISON_TURNS', payload: effects.opponentPoisonTurns })
    dispatch({ type: 'SET_MY_PARALYZED', payload: effects.myParalyzed })
    dispatch({ type: 'SET_MY_DEF_BUFF', payload: effects.myDefBuff })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return {
    state,
    processEvent,
    selectAction,
    addLog,
    updateHp,
    updateEffects,
    reset,
  }
}

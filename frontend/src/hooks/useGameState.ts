import { useReducer, useCallback } from 'react'
import type { Creature, GameScreen, EvolutionStage } from '../types/creature'
import type { BattleResult } from '../types/battle'
import {
  feedCreature,
  trainCreature,
  playWithCreature,
  toggleSleep,
  applyTimeUpdate,
} from '../utils/gameLogic'
import { evolveCreature } from '../utils/evolution'
import { saveCreature, deleteCreature } from '../utils/storage'

export interface GameState {
  creature: Creature | null
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  attackAnimation: boolean
  evolvedFrom: EvolutionStage | null
  message: string | null
}

type Action =
  | { type: 'SET_SCREEN'; payload: GameScreen }
  | { type: 'SET_CREATURE'; payload: Creature | null }
  | { type: 'TOGGLE_DEV_MODE' }
  | { type: 'SET_PENDING_EVOLUTION'; payload: boolean }
  | { type: 'SET_ATTACK_ANIMATION'; payload: boolean }
  | { type: 'SET_EVOLVED_FROM'; payload: EvolutionStage | null }
  | { type: 'SET_MESSAGE'; payload: string | null }
  | { type: 'APPLY_BATTLE_RESULT'; payload: BattleResult }

const initialState: GameState = {
  creature: null,
  screen: 'title',
  devMode: false,
  pendingEvolution: false,
  attackAnimation: false,
  evolvedFrom: null,
  message: null,
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }
    case 'SET_CREATURE':
      return { ...state, creature: action.payload }
    case 'TOGGLE_DEV_MODE':
      return { ...state, devMode: !state.devMode }
    case 'SET_PENDING_EVOLUTION':
      return { ...state, pendingEvolution: action.payload }
    case 'SET_ATTACK_ANIMATION':
      return { ...state, attackAnimation: action.payload }
    case 'SET_EVOLVED_FROM':
      return { ...state, evolvedFrom: action.payload }
    case 'SET_MESSAGE':
      return { ...state, message: action.payload }
    case 'APPLY_BATTLE_RESULT': {
      if (!state.creature) return state
      const { expGain, happinessChange, hpAfterBattle, result } = action.payload
      const updated: Creature = {
        ...state.creature,
        exp: state.creature.exp + expGain,
        happiness: Math.max(0, Math.min(100, state.creature.happiness + happinessChange)),
        hp: Math.max(1, hpAfterBattle),
        wins: result === 'win' ? (state.creature.wins ?? 0) + 1 : (state.creature.wins ?? 0),
        losses: result === 'lose' ? (state.creature.losses ?? 0) + 1 : (state.creature.losses ?? 0),
      }
      return { ...state, creature: updated }
    }
    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const showMessage = useCallback((msg: string) => {
    dispatch({ type: 'SET_MESSAGE', payload: msg })
    setTimeout(() => dispatch({ type: 'SET_MESSAGE', payload: null }), 2500)
  }, [])

  const startGame = useCallback((creature: Creature) => {
    dispatch({ type: 'SET_CREATURE', payload: creature })
    dispatch({ type: 'SET_SCREEN', payload: 'main' })
    saveCreature(creature)
  }, [])

  const loadGame = useCallback((creature: Creature) => {
    dispatch({ type: 'SET_CREATURE', payload: creature })
    dispatch({ type: 'SET_SCREEN', payload: 'main' })
  }, [])

  const applyUpdate = useCallback((devMode: boolean) => {
    dispatch({
      type: 'SET_CREATURE',
      payload: state.creature ? applyTimeUpdate(state.creature, devMode) : null,
    })
    if (state.creature) {
      const updated = applyTimeUpdate(state.creature, devMode)
      if (!updated.isAlive && state.creature.isAlive) {
        dispatch({ type: 'SET_CREATURE', payload: updated })
        saveCreature(updated)
        dispatch({ type: 'SET_SCREEN', payload: 'death' })
      } else {
        dispatch({ type: 'SET_CREATURE', payload: updated })
        saveCreature(updated)
      }
    }
  }, [state.creature])

  const feed = useCallback(() => {
    if (!state.creature) return
    const updated = feedCreature(state.creature)
    dispatch({ type: 'SET_CREATURE', payload: updated })
    saveCreature(updated)
    showMessage('もぐもぐ！ご飯を食べた！')
  }, [state.creature, showMessage])

  const train = useCallback(() => {
    if (!state.creature) return
    const updated = trainCreature(state.creature)
    dispatch({ type: 'SET_CREATURE', payload: updated })
    dispatch({ type: 'SET_ATTACK_ANIMATION', payload: true })
    saveCreature(updated)
    showMessage('トレーニング完了！強くなった！')
    setTimeout(() => dispatch({ type: 'SET_ATTACK_ANIMATION', payload: false }), 1000)
  }, [state.creature, showMessage])

  const play = useCallback(() => {
    if (!state.creature) return
    const updated = playWithCreature(state.creature)
    dispatch({ type: 'SET_CREATURE', payload: updated })
    saveCreature(updated)
    showMessage('一緒に遊んだ！楽しかった！')
  }, [state.creature, showMessage])

  const sleep = useCallback(() => {
    if (!state.creature) return
    const updated = toggleSleep(state.creature)
    dispatch({ type: 'SET_CREATURE', payload: updated })
    saveCreature(updated)
    showMessage(updated.isSleeping ? 'おやすみなさい…💤' : 'おはよう！元気いっぱい！')
  }, [state.creature, showMessage])

  const evolve = useCallback(() => {
    if (!state.creature) return
    const prevStage = state.creature.evolutionStage
    const evolved = evolveCreature(state.creature)
    dispatch({ type: 'SET_EVOLVED_FROM', payload: prevStage })
    dispatch({ type: 'SET_CREATURE', payload: evolved })
    saveCreature(evolved)
    dispatch({ type: 'SET_SCREEN', payload: 'evolution' })
    dispatch({ type: 'SET_PENDING_EVOLUTION', payload: false })
  }, [state.creature])

  const startOver = useCallback(async () => {
    await deleteCreature()
    dispatch({ type: 'SET_CREATURE', payload: null })
    dispatch({ type: 'SET_SCREEN', payload: 'title' })
    dispatch({ type: 'SET_PENDING_EVOLUTION', payload: false })
    dispatch({ type: 'SET_EVOLVED_FROM', payload: null })
  }, [])

  const goToStatus = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'status' })
  }, [])

  const goToMain = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'main' })
  }, [])

  const toggleDevMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DEV_MODE' })
  }, [])

  const setPendingEvolution = useCallback((val: boolean) => {
    dispatch({ type: 'SET_PENDING_EVOLUTION', payload: val })
  }, [])

  const applyBattleResult = useCallback((result: BattleResult) => {
    dispatch({ type: 'APPLY_BATTLE_RESULT', payload: result })
    if (state.creature) {
      const updated: Creature = {
        ...state.creature,
        exp: state.creature.exp + result.expGain,
        happiness: Math.max(0, Math.min(100, state.creature.happiness + result.happinessChange)),
        hp: Math.max(1, result.hpAfterBattle),
        wins: result.result === 'win' ? (state.creature.wins ?? 0) + 1 : (state.creature.wins ?? 0),
        losses: result.result === 'lose' ? (state.creature.losses ?? 0) + 1 : (state.creature.losses ?? 0),
      }
      saveCreature(updated)
    }
  }, [state.creature])

  return {
    state,
    actions: {
      startGame,
      loadGame,
      applyUpdate,
      feed,
      train,
      play,
      sleep,
      evolve,
      startOver,
      goToStatus,
      goToMain,
      toggleDevMode,
      setPendingEvolution,
      applyBattleResult,
    },
  }
}

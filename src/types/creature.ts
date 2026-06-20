export type CreatureId =
  | 'egg'
  | 'baby'
  | 'childA' | 'childB' | 'childC'
  | 'adultA1' | 'adultA2'
  | 'adultB1' | 'adultB2'
  | 'adultC1' | 'adultC2'
  | 'perfectA1' | 'perfectA2'
  | 'perfectB1' | 'perfectB2'
  | 'perfectC1' | 'perfectC2'
  | 'ultimateA' | 'ultimateB' | 'ultimateC'

export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5

export interface Creature {
  id: string
  name: string
  creatureId: CreatureId
  evolutionStage: EvolutionStage
  level: number
  exp: number
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  hunger: number      // 0-100
  happiness: number   // 0-100
  age: number         // in days (fractional)
  weight: number
  isSleeping: boolean // 実時刻（夜 22:00〜6:00）に同期して自動更新される
  lightsOn?: boolean  // 部屋の照明。未指定は ON 扱い（既存セーブ互換）
  isAlive: boolean
  lastUpdated: number // timestamp
  evolutionName: string
  totalDeaths: number
  trainCount: number
  playCount: number
  feedCount: number
  wins?: number
  losses?: number
}

export type GameScreen = 'title' | 'setup' | 'main' | 'evolution' | 'death' | 'status' | 'battle_lobby' | 'battle' | 'zukan'

export interface GameState {
  creatures: Creature[]
  activeCreatureId: string | null
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  animationState: 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead'
  message: string | null
}

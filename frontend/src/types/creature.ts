export type CreatureType = 'Fire' | 'Water' | 'Plant' | 'Thunder' | 'Dark' | 'Light'

export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5

export interface Creature {
  id: string
  name: string
  type: CreatureType
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
  isSleeping: boolean
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

export type GameScreen = 'title' | 'setup' | 'main' | 'evolution' | 'death' | 'status' | 'battle_lobby' | 'battle'

export interface GameState {
  creature: Creature | null
  screen: GameScreen
  devMode: boolean
  pendingEvolution: boolean
  animationState: 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead'
  message: string | null
}

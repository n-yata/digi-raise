export type BattleAction = 'attack' | 'guard' | 'special'
export type BattleRole = 'host' | 'guest'
export type BattlePhase = 'waiting' | 'ready' | 'selecting' | 'resolving' | 'finished'

export interface CreatureSnapshot {
  name: string
  evolutionStage: number
  type: string
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  level?: number
}

export interface BattleState {
  phase: BattlePhase
  roomCode: string | null
  role: BattleRole | null
  myCreature: CreatureSnapshot | null
  opponentCreature: CreatureSnapshot | null
  currentTurn: number
  myAction: BattleAction | null
  opponentAction: BattleAction | null
  specialCooldown: number
  myPoisonTurns: number
  opponentPoisonTurns: number
  myParalyzed: boolean
  myDefBuff: number
  battleLog: string[]
  winner: 'me' | 'opponent' | 'draw' | null
  error: string | null
}

// バトルイベント型（ローカルバトルで使用）
export type ServerEvent =
  | { event: 'battle_start'; seed: number; yourRole: BattleRole }
  | { event: 'turn_resolved'; turnNumber: number }
  | { event: 'battle_end'; winner: 'host' | 'guest' | 'draw' }
  | { event: 'error'; code: string; message: string }

export interface BattleResult {
  result: 'win' | 'lose' | 'draw'
  expGain: number
  happinessChange: number
  hpAfterBattle: number
}

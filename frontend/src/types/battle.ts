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

// WebSocketメッセージ型（サーバー→クライアント）
export type ServerEvent =
  | { event: 'room_created'; roomCode: string }
  | { event: 'room_joined'; roomCode: string; hostCreature: CreatureSnapshot }
  | { event: 'opponent_joined'; opponentCreature: CreatureSnapshot }
  | { event: 'battle_start'; seed: number; yourRole: BattleRole }
  | { event: 'actions_locked'; hostAction: string; guestAction: string; seed: number }
  | { event: 'turn_resolved'; turnNumber: number }
  | { event: 'battle_end'; winner: 'host' | 'guest' | 'draw' }
  | { event: 'opponent_disconnected' }
  | { event: 'error'; code: string; message: string }
  | { event: 'pong' }

export interface BattleResult {
  result: 'win' | 'lose' | 'draw'
  expGain: number
  happinessChange: number
  hpAfterBattle: number
}

import type { BattleAction, CreatureSnapshot } from './battle'

/**
 * P2P DataChannel 上でやり取りするメッセージ型
 *
 * ホスト（対戦を作成した側）が権限を持つ:
 * - シード生成
 * - 両者のアクション受信後に actions_locked を発行
 */
export type P2PMessage =
  | P2PCreatureInfo
  | P2PReady
  | P2PBattleStart
  | P2PActionSelected
  | P2PActionsLocked
  | P2PBattleEnd
  | P2PPing
  | P2PPong

/** クリーチャー情報の交換（接続直後に双方が送信） */
export interface P2PCreatureInfo {
  type: 'creature_info'
  creature: CreatureSnapshot
}

/** 準備完了（ゲスト→ホスト、ホスト→ゲスト） */
export interface P2PReady {
  type: 'ready'
}

/** バトル開始（ホスト→ゲスト） */
export interface P2PBattleStart {
  type: 'battle_start'
  seed: number
}

/** アクション選択（双方向: 選択者→相手） */
export interface P2PActionSelected {
  type: 'action_selected'
  action: BattleAction
}

/** アクション確定（ホスト→ゲスト: 両者のアクションが揃った後） */
export interface P2PActionsLocked {
  type: 'actions_locked'
  hostAction: BattleAction
  guestAction: BattleAction
  seed: number
}

/** バトル終了（ホスト→ゲスト） */
export interface P2PBattleEnd {
  type: 'battle_end'
  winner: 'host' | 'guest' | 'draw'
}

/** Keep-alive */
export interface P2PPing {
  type: 'ping'
}

export interface P2PPong {
  type: 'pong'
}

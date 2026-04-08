import type { CreatureType, EvolutionStage } from '../types/creature'
import type { CreatureSnapshot, BattleAction } from '../types/battle'
import { EVOLUTION_NAMES } from '../data/evolutions'

const CREATURE_TYPES: CreatureType[] = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']

/**
 * 自クリーチャーのステータスに合わせたCPUクリーチャーを生成する。
 * ステータスは±10%のランダム変動を加える。
 */
export function generateCpuCreature(playerCreature: CreatureSnapshot): CreatureSnapshot {
  // プレイヤーと異なるタイプをランダムに選択
  const availableTypes = CREATURE_TYPES.filter(t => t !== playerCreature.type)
  const cpuType = availableTypes[Math.floor(Math.random() * availableTypes.length)]

  // プレイヤーの進化段階に合わせる
  const stage = playerCreature.evolutionStage as EvolutionStage
  const names = EVOLUTION_NAMES[cpuType]
  const cpuName = names[stage] ?? names[names.length - 1]

  // ステータスを±10%でランダム変動
  const vary = (base: number): number => {
    const factor = 0.9 + Math.random() * 0.2 // 0.9 ~ 1.1
    return Math.max(1, Math.floor(base * factor))
  }

  return {
    name: cpuName,
    evolutionStage: playerCreature.evolutionStage,
    type: cpuType,
    hp: vary(playerCreature.maxHp),
    maxHp: vary(playerCreature.maxHp),
    atk: vary(playerCreature.atk),
    def: vary(playerCreature.def),
    spd: vary(playerCreature.spd),
    level: playerCreature.level,
  }
}

/**
 * CPUのアクションをランダムに選択する。
 * スペシャルがクールダウン中の場合はattack/guardから選ぶ。
 */
export function selectCpuAction(specialCooldown: number): BattleAction {
  if (specialCooldown > 0) {
    const actions: BattleAction[] = ['attack', 'guard']
    return actions[Math.floor(Math.random() * actions.length)]
  }
  const actions: BattleAction[] = ['attack', 'guard', 'special']
  return actions[Math.floor(Math.random() * actions.length)]
}

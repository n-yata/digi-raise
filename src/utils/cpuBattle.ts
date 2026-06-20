import type { EvolutionStage } from '../types/creature'
import type { CreatureSnapshot, BattleAction } from '../types/battle'
import { CREATURE_TREE } from '../data/evolutions'

export function generateCpuCreature(playerCreature: CreatureSnapshot): CreatureSnapshot {
  const stage = playerCreature.evolutionStage as EvolutionStage
  const candidates = Object.values(CREATURE_TREE).filter(
    def => def.stage === stage && def.name !== playerCreature.name
  )
  const picked = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : CREATURE_TREE['baby']

  const vary = (base: number): number => {
    const factor = 0.9 + Math.random() * 0.2
    return Math.max(1, Math.floor(base * factor))
  }

  return {
    name: picked.name,
    evolutionStage: playerCreature.evolutionStage,
    type: picked.id,
    hp: vary(playerCreature.maxHp),
    maxHp: vary(playerCreature.maxHp),
    atk: vary(playerCreature.atk),
    def: vary(playerCreature.def),
    spd: vary(playerCreature.spd),
    level: playerCreature.level,
  }
}

export function selectCpuAction(specialCooldown: number): BattleAction {
  if (specialCooldown > 0) {
    const actions: BattleAction[] = ['attack', 'guard']
    return actions[Math.floor(Math.random() * actions.length)]
  }
  const actions: BattleAction[] = ['attack', 'guard', 'special']
  return actions[Math.floor(Math.random() * actions.length)]
}

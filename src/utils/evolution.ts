import type { Creature, CreatureType, EvolutionStage } from '../types/creature'
import {
  EVOLUTION_REQUIREMENTS,
  EVOLUTION_NAMES,
  BASE_STATS,
} from '../data/evolutions'

/**
 * 育て方（育成アクションの累計回数）から進化先タイプを決定する。
 * 「最多アクション＋次点」の組み合わせで6タイプに割り当てる。
 *   トレ→あそぶ: Fire  / トレ→えさ: Plant
 *   あそぶ→トレ: Thunder / あそぶ→えさ: Light
 *   えさ→あそぶ: Water / えさ→トレ: Dark
 * 全アクション未実施（全回数0）の場合は Water（バランス）。
 * 同数時は train > play > feed の優先順位でタイブレーク。
 */
export function determineTypeFromRaising(
  counts: { trainCount: number; playCount: number; feedCount: number }
): CreatureType {
  const { trainCount, playCount, feedCount } = counts
  if (trainCount === 0 && playCount === 0 && feedCount === 0) return 'Water'

  const priority: Record<'train' | 'play' | 'feed', number> = { train: 0, play: 1, feed: 2 }
  const entries: { key: 'train' | 'play' | 'feed'; count: number }[] = [
    { key: 'train', count: trainCount },
    { key: 'play', count: playCount },
    { key: 'feed', count: feedCount },
  ]
  entries.sort((a, b) => b.count - a.count || priority[a.key] - priority[b.key])
  const dominant = entries[0].key
  const runnerUp = entries[1].key

  const table: Record<string, CreatureType> = {
    'train|play': 'Fire',
    'train|feed': 'Plant',
    'play|train': 'Thunder',
    'play|feed': 'Light',
    'feed|play': 'Water',
    'feed|train': 'Dark',
  }
  return table[`${dominant}|${runnerUp}`] ?? 'Water'
}

export function canEvolve(creature: Creature): boolean {
  if (!creature.isAlive) return false
  if (creature.evolutionStage >= 5) return false
  if (creature.isSleeping) return false

  const req = EVOLUTION_REQUIREMENTS[creature.evolutionStage]
  if (!req) return false

  if (creature.age < req.minAge) return false
  if (req.minHappiness !== undefined && creature.happiness < req.minHappiness) return false
  if (req.minLevel !== undefined && creature.level < req.minLevel) return false
  if (req.minCombatStats !== undefined && (creature.atk + creature.def + creature.spd) < req.minCombatStats) return false
  if (req.minEachStat !== undefined) {
    if (creature.atk < req.minEachStat || creature.def < req.minEachStat || creature.spd < req.minEachStat) return false
  }

  return true
}

export function evolveCreature(creature: Creature): Creature {
  const nextStage = (creature.evolutionStage + 1) as EvolutionStage
  const baseStats = BASE_STATS[nextStage]

  // チャイルド以降（nextStage>=2）の進化では、その時点の育て方で進化先タイプを毎回再判定する。
  // タマゴ→ベイビー（nextStage=1）は孵化のみで中立タイプを維持。
  const newType: CreatureType = nextStage >= 2
    ? determineTypeFromRaising(creature)
    : creature.type
  const evolutionName = EVOLUTION_NAMES[newType][nextStage]

  return {
    ...creature,
    type: newType,
    evolutionStage: nextStage,
    evolutionName,
    maxHp: baseStats.hp,
    hp: baseStats.hp,
    atk: Math.max(creature.atk + 8, baseStats.atk),
    def: Math.max(creature.def + 6, baseStats.def),
    spd: Math.max(creature.spd + 6, baseStats.spd),
    hunger: Math.min(100, creature.hunger + 20),
    happiness: Math.min(100, creature.happiness + 30),
    lastUpdated: Date.now(),
  }
}

export function getEvolutionProgress(creature: Creature): { met: boolean; label: string; value: number; max: number }[] {
  if (creature.evolutionStage >= 5) return []
  const req = EVOLUTION_REQUIREMENTS[creature.evolutionStage]
  if (!req) return []

  const checks: { met: boolean; label: string; value: number; max: number }[] = []

  checks.push({
    met: creature.age >= req.minAge,
    label: '年齢',
    value: Math.floor(creature.age * 10) / 10,
    max: req.minAge,
  })

  if (req.minHappiness !== undefined) {
    checks.push({
      met: creature.happiness >= req.minHappiness,
      label: '幸福度',
      value: creature.happiness,
      max: req.minHappiness,
    })
  }

  if (req.minLevel !== undefined) {
    checks.push({
      met: creature.level >= req.minLevel,
      label: 'レベル',
      value: creature.level,
      max: req.minLevel,
    })
  }

  if (req.minCombatStats !== undefined) {
    checks.push({
      met: (creature.atk + creature.def + creature.spd) >= req.minCombatStats,
      label: '戦闘力',
      value: creature.atk + creature.def + creature.spd,
      max: req.minCombatStats,
    })
  }

  if (req.minEachStat !== undefined) {
    checks.push({
      met: creature.atk >= req.minEachStat && creature.def >= req.minEachStat && creature.spd >= req.minEachStat,
      label: '最低ステータス',
      value: Math.min(creature.atk, creature.def, creature.spd),
      max: req.minEachStat,
    })
  }

  return checks
}

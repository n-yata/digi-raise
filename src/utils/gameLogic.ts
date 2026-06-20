import type { Creature, EvolutionStage } from '../types/creature'
import { CREATURE_TREE, BASE_STATS, EXP_TO_LEVEL } from '../data/evolutions'

export function createNewCreature(name: string): Creature {
  const baseStats = BASE_STATS[0]
  const now = Date.now()
  return {
    id: `egg-${now}`,
    name,
    creatureId: 'egg',
    evolutionStage: 0 as EvolutionStage,
    level: 1,
    exp: 0,
    hp: baseStats.hp,
    maxHp: baseStats.hp,
    atk: baseStats.atk,
    def: baseStats.def,
    spd: baseStats.spd,
    hunger: 80,
    happiness: 70,
    age: 0,
    weight: 10,
    isSleeping: false,
    isAlive: true,
    lastUpdated: now,
    evolutionName: CREATURE_TREE['egg'].name,
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
  }
}

function addExp(creature: Creature, amount: number): Creature {
  let newExp = creature.exp + amount
  let newLevel = creature.level
  while (newExp >= EXP_TO_LEVEL(newLevel)) {
    newExp -= EXP_TO_LEVEL(newLevel)
    newLevel += 1
  }
  return { ...creature, exp: newExp, level: newLevel }
}

export function feedCreature(creature: Creature): Creature {
  if (!creature.isAlive || creature.isSleeping || creature.hunger >= 100) return creature
  const isOverfed = creature.hunger >= 90
  return {
    ...creature,
    hunger: Math.min(100, creature.hunger + 30),
    happiness: Math.min(100, creature.happiness + 5),
    weight: creature.weight + (isOverfed ? 3 : 1),
    feedCount: creature.feedCount + 1,
    lastUpdated: Date.now(),
  }
}

/** タップ1回あたりの獲得経験値。 */
export const EXP_PER_TAP = 2

/**
 * トレーニングを適用する。連打ミニゲームでタップした回数 `taps` に比例して
 * 経験値（`EXP_PER_TAP × taps`）を獲得し、atk/def/spd はランダムに 1〜3 成長する。
 * タップ 0 回（一度も叩けなかった）場合は何も起きない。
 */
export function trainCreature(creature: Creature, taps: number = 0): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  if (taps <= 0) return creature
  const atkGain = Math.floor(Math.random() * 3) + 1
  const defGain = Math.floor(Math.random() * 3) + 1
  const spdGain = Math.floor(Math.random() * 3) + 1
  const expGain = EXP_PER_TAP * taps
  const updated = addExp(
    {
      ...creature,
      atk: creature.atk + atkGain,
      def: creature.def + defGain,
      spd: creature.spd + spdGain,
      hunger: Math.max(0, creature.hunger - 10),
      happiness: Math.max(0, creature.happiness - 5),
      trainCount: creature.trainCount + 1,
    },
    expGain
  )
  return { ...updated, lastUpdated: Date.now() }
}

export function playWithCreature(creature: Creature, success: boolean = true): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  return {
    ...creature,
    happiness: Math.min(100, creature.happiness + (success ? 20 : 5)),
    hunger: Math.max(0, creature.hunger - 5),
    playCount: creature.playCount + 1,
    lastUpdated: Date.now(),
  }
}

export function toggleSleep(creature: Creature): Creature {
  if (!creature.isAlive) return creature
  return {
    ...creature,
    isSleeping: !creature.isSleeping,
    lastUpdated: Date.now(),
  }
}

export function applyTimeUpdate(creature: Creature, devMode: boolean): Creature {
  if (!creature.isAlive) return creature

  const now = Date.now()
  const elapsed = now - creature.lastUpdated
  const thirtyMinutes = devMode ? 1000 * 30 : 1000 * 60 * 30

  const thirtyMinTicks = Math.floor(elapsed / thirtyMinutes)

  if (thirtyMinTicks === 0) return creature

  let updated = { ...creature }

  // Apply 30-min ticks
  updated.hunger = Math.max(0, updated.hunger - thirtyMinTicks * 5)
  updated.happiness = Math.max(0, updated.happiness - thirtyMinTicks * 2)

  // Apply hourly effects: 2 thirty-min ticks = 1 game-hour
  // age はティック数 × 0.5 ずつ増える（float。表示は Math.floor）
  updated.age = updated.age + thirtyMinTicks * 0.5
  if (updated.isSleeping) {
    // 30分ティックごとに最大HPの10%を回復
    const hpPerTick = Math.ceil(updated.maxHp * 0.1)
    updated.hp = Math.min(updated.maxHp, updated.hp + thirtyMinTicks * hpPerTick)
  }

  // Starvation damage
  if (updated.hunger <= 0) {
    updated.hp = Math.max(0, updated.hp - thirtyMinTicks * 5)
  }

  // Death check
  if (updated.hp <= 0) {
    updated.isAlive = false
    updated.hp = 0
  }

  updated.lastUpdated = now
  return updated
}

/** メイン画面で一時的に再生するアクション演出の種別。 */
export type ActionAnim = 'attack' | 'eating' | 'happy'

export function getAnimationState(
  creature: Creature,
  actionOverride: ActionAnim | null = null
): 'idle' | 'happy' | 'sleeping' | 'attack' | 'eating' | 'evolving' | 'dead' | 'sad' | 'hungry' | 'critical' {
  if (!creature.isAlive) return 'dead'
  // 明示アクション（ごはん/遊び/トレ）はその場で即フィードバック。dead 以外より優先。
  if (actionOverride) return actionOverride
  if (creature.isSleeping) return 'sleeping'
  if (creature.hp <= creature.maxHp * 0.2) return 'critical'
  if (creature.hunger <= 20) return 'hungry'
  if (creature.happiness <= 30) return 'sad'
  if (creature.happiness > 70) return 'happy'
  return 'idle'
}

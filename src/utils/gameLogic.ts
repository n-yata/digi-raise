import type { Creature, CreatureType, EvolutionStage } from '../types/creature'
import { EVOLUTION_NAMES, BASE_STATS, EXP_TO_LEVEL } from '../data/evolutions'

export function createNewCreature(name: string, type: CreatureType): Creature {
  const baseStats = BASE_STATS[0]
  const now = Date.now()
  return {
    id: `${type}-${now}`,
    name,
    type,
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
    evolutionName: EVOLUTION_NAMES[type][0],
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
  if (!creature.isAlive || creature.isSleeping) return creature
  const isOverfed = creature.hunger >= 90
  const updated = addExp(
    {
      ...creature,
      hunger: Math.min(100, creature.hunger + 30),
      happiness: Math.min(100, creature.happiness + 5),
      weight: creature.weight + (isOverfed ? 3 : 1),
      feedCount: creature.feedCount + 1,
    },
    2
  )
  return { ...updated, lastUpdated: Date.now() }
}

export function trainCreature(creature: Creature, success: boolean = true): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  const atkGain = success ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2)
  const defGain = success ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2)
  const spdGain = success ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2)
  const expGain = success ? 20 : 5
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

export function playWithCreature(creature: Creature): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  const updated = addExp(
    {
      ...creature,
      happiness: Math.min(100, creature.happiness + 20),
      hunger: Math.max(0, creature.hunger - 5),
      playCount: creature.playCount + 1,
    },
    5
  )
  return { ...updated, lastUpdated: Date.now() }
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
  const oneHour = devMode ? 1000 * 60 : 1000 * 60 * 60

  const thirtyMinTicks = Math.floor(elapsed / thirtyMinutes)
  const hourTicks = Math.floor(elapsed / oneHour)

  if (thirtyMinTicks === 0) return creature

  let updated = { ...creature }

  // Apply 30-min ticks
  updated.hunger = Math.max(0, updated.hunger - thirtyMinTicks * 5)
  updated.happiness = Math.max(0, updated.happiness - thirtyMinTicks * 2)

  // Apply hourly ticks
  if (hourTicks > 0) {
    updated.age = updated.age + hourTicks
    if (updated.isSleeping) {
      updated.hp = Math.min(updated.maxHp, updated.hp + hourTicks * 10)
    }
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

export function getAnimationState(
  creature: Creature,
  isAttacking: boolean
): 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead' {
  if (!creature.isAlive) return 'dead'
  if (isAttacking) return 'attack'
  if (creature.isSleeping) return 'sleeping'
  if (creature.happiness > 70) return 'happy'
  return 'idle'
}

import type { CreatureSnapshot } from '../types/battle'

const VALID_TYPES = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light'] as const
const MAX_STAT = 9999
const MAX_HP = 9999
const MAX_LEVEL = 100
const MAX_STAGE = 4

function isValidStat(v: unknown, max = MAX_STAT): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v > 0 && v <= max
}

export function encodeCreatureForQR(creature: CreatureSnapshot): string {
  return JSON.stringify(creature)
}

export function decodeCreatureFromQR(data: string): CreatureSnapshot | null {
  try {
    const obj = JSON.parse(data)

    if (typeof obj.name !== 'string' || !obj.name) return null
    if (typeof obj.evolutionStage !== 'number' || !Number.isInteger(obj.evolutionStage) || obj.evolutionStage < 0 || obj.evolutionStage > MAX_STAGE) return null
    if (typeof obj.type !== 'string' || !obj.type) return null
    if (!(VALID_TYPES as readonly string[]).includes(obj.type)) return null
    if (!isValidStat(obj.hp, MAX_HP)) return null
    if (!isValidStat(obj.maxHp, MAX_HP)) return null
    if (obj.hp > obj.maxHp) return null
    if (!isValidStat(obj.atk)) return null
    if (!isValidStat(obj.def)) return null
    if (!isValidStat(obj.spd)) return null

    const level = typeof obj.level === 'number' && Number.isInteger(obj.level) && obj.level >= 1 && obj.level <= MAX_LEVEL
      ? obj.level : 1

    return {
      name: String(obj.name).slice(0, 20),
      evolutionStage: obj.evolutionStage,
      type: obj.type,
      hp: obj.hp,
      maxHp: obj.maxHp,
      atk: obj.atk,
      def: obj.def,
      spd: obj.spd,
      level,
    }
  } catch {
    return null
  }
}

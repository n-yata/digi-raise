import { openDB, type IDBPDatabase } from 'idb'
import type { Creature, CreatureId } from '../types/creature'
import { CREATURE_TREE } from '../data/evolutions'

export function validateCreature(c: unknown): c is Creature {
  if (typeof c !== 'object' || c === null) return false
  const obj = c as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length > 64) return false
  if (typeof obj.name !== 'string' || obj.name.length < 1 || obj.name.length > 30) return false
  if (typeof obj.creatureId !== 'string') return false
  if (!Object.prototype.hasOwnProperty.call(CREATURE_TREE, obj.creatureId)) return false

  const numFields: (keyof Creature)[] = [
    'hp', 'maxHp', 'atk', 'def', 'spd', 'level', 'exp', 'hunger', 'happiness', 'age', 'weight',
    // 競合解決（cloudSave.getLocalUpdatedAt）に直結する lastUpdated、および型上必須の集計フィールド
    'lastUpdated', 'totalDeaths', 'trainCount', 'playCount', 'feedCount',
  ]
  for (const field of numFields) {
    const val = obj[field]
    if (typeof val !== 'number' || !isFinite(val)) return false
  }

  // 任意フィールドは存在する場合のみ数値検証する
  const optionalNumFields: (keyof Creature)[] = ['wins', 'losses']
  for (const field of optionalNumFields) {
    if (obj[field] !== undefined && (typeof obj[field] !== 'number' || !isFinite(obj[field] as number))) return false
  }

  if (typeof obj.evolutionName !== 'string') return false
  if (typeof obj.isAlive !== 'boolean') return false
  if (typeof obj.isSleeping !== 'boolean') return false

  const stage = obj.evolutionStage
  if (typeof stage !== 'number' || !Number.isInteger(stage) || stage < 0 || stage > 5) return false

  return true
}

export function validateSaveData(data: unknown): data is SaveData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.creatures)) return false
  if (obj.creatures.length > 50) return false
  for (const c of obj.creatures) {
    if (!validateCreature(c)) return false
  }

  if (obj.activeCreatureId !== null && typeof obj.activeCreatureId !== 'string') return false
  if (typeof obj.activeCreatureId === 'string') {
    const exists = (obj.creatures as Array<{ id: string }>).some((c) => c.id === obj.activeCreatureId)
    if (!exists) return false
  }

  if (obj.discoveredCreatures !== undefined) {
    if (!Array.isArray(obj.discoveredCreatures)) return false
    for (const id of obj.discoveredCreatures) {
      if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(CREATURE_TREE, id)) return false
    }
  }

  return true
}

const DB_NAME = 'digi-raise'
const DB_VERSION = 1
const STORE_NAME = 'gameState'
const LEGACY_KEY = 'currentCreature'
const SAVE_DATA_KEY = 'saveData'

export interface SaveData {
  creatures: Creature[]
  activeCreatureId: string | null
  discoveredCreatures?: CreatureId[]
}

let db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return db
}

export async function saveSaveData(saveData: SaveData): Promise<void> {
  try {
    const database = await getDB()
    await database.put(STORE_NAME, saveData, SAVE_DATA_KEY)
  } catch (err) {
    console.error('Failed to save save data:', err)
  }
}

export async function loadSaveData(): Promise<SaveData | null> {
  try {
    const database = await getDB()
    const saveData = await database.get(STORE_NAME, SAVE_DATA_KEY)
    if (saveData == null) return null
    // IndexedDB の生データを信用せず検証する。失敗時は破棄して null を返し、
    // 呼び出し側で新規作成へフォールバックさせる（クラウド経路 pullFromCloud と同じ挙動）。
    if (!validateSaveData(saveData)) {
      console.error('Local save data failed validation, ignoring')
      return null
    }
    return saveData
  } catch (err) {
    console.error('Failed to load save data:', err)
    return null
  }
}

export async function deleteSaveData(): Promise<void> {
  try {
    const database = await getDB()
    await database.delete(STORE_NAME, SAVE_DATA_KEY)
  } catch (err) {
    console.error('Failed to delete save data:', err)
  }
}

export async function migrateLegacyData(): Promise<void> {
  try {
    const database = await getDB()

    // 新キーが既にあれば何もしない（冪等）
    const existing = await database.get(STORE_NAME, SAVE_DATA_KEY)
    if (existing != null) return

    const legacy = await database.get(STORE_NAME, LEGACY_KEY)
    if (legacy == null) return

    if (typeof legacy !== 'object' || legacy === null || typeof (legacy as Record<string, unknown>).id !== 'string') {
      console.warn('Legacy data is invalid, skipping migration')
      return
    }

    const saveData: SaveData = {
      creatures: [legacy as Creature],
      activeCreatureId: (legacy as Creature).id,
    }
    await database.put(STORE_NAME, saveData, SAVE_DATA_KEY)
    await database.delete(STORE_NAME, LEGACY_KEY)
  } catch (err) {
    console.error('Failed to migrate legacy data:', err)
  }
}


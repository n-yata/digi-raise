import { openDB, type IDBPDatabase } from 'idb'
import type { Creature, CreatureType } from '../types/creature'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

const VALID_CREATURE_TYPES: CreatureType[] = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']

function validateCreature(c: unknown): c is Creature {
  if (typeof c !== 'object' || c === null) return false
  const obj = c as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length > 64) return false
  if (typeof obj.name !== 'string' || obj.name.length < 1 || obj.name.length > 30) return false
  if (!VALID_CREATURE_TYPES.includes(obj.type as CreatureType)) return false

  const numFields: (keyof Creature)[] = ['hp', 'maxHp', 'atk', 'def', 'spd', 'level', 'exp', 'hunger', 'happiness', 'age', 'weight']
  for (const field of numFields) {
    const val = obj[field]
    if (typeof val !== 'number' || !isFinite(val)) return false
  }

  if (typeof obj.isAlive !== 'boolean') return false
  if (typeof obj.isSleeping !== 'boolean') return false

  const stage = obj.evolutionStage
  if (typeof stage !== 'number' || !Number.isInteger(stage) || stage < 0 || stage > 5) return false

  return true
}

function validateSaveData(data: unknown): data is SaveData {
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
    return saveData ?? null
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

// File System Access API - Export save
export async function exportSave(saveData: SaveData): Promise<void> {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    saveData,
  }
  const json = JSON.stringify(data, null, 2)
  const fileName = `digi-raise-save-${Date.now()}.json`

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'DigiRaise Save File',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return
    } catch (err) {
      if ((err as { name: string }).name !== 'AbortError') {
        console.error('File save error:', err)
      }
      return
    }
  }

  // Fallback: download via anchor
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// File System Access API - Import save
export async function importSave(): Promise<SaveData | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as Window & { showOpenFilePicker: (options: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
        types: [
          {
            description: 'DigiRaise Save File',
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const file = await handle.getFile()
      if (file.size > MAX_FILE_SIZE) {
        console.error('Save file exceeds 1MB limit')
        return null
      }
      const text = await file.text()
      return parseSaveFile(text)
    } catch (err) {
      if ((err as { name: string }).name !== 'AbortError') {
        console.error('File open error:', err)
      }
      return null
    }
  }

  // Fallback: file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      if (file.size > MAX_FILE_SIZE) {
        console.error('Save file exceeds 1MB limit')
        resolve(null)
        return
      }
      const text = await file.text()
      resolve(parseSaveFile(text))
    }
    input.click()
  })
}

function parseSaveFile(text: string): SaveData | null {
  try {
    const parsed = JSON.parse(text)

    // バージョンチェック
    if (parsed.version !== undefined && parsed.version !== 1 && parsed.version !== 2) {
      return null
    }

    // version 2: SaveData 形式
    if (parsed.saveData != null) {
      const saveData = parsed.saveData as SaveData
      if (!validateSaveData(saveData)) return null
      return saveData
    }

    // version 1 (後方互換): 単体クリーチャー形式
    if (parsed.creature != null) {
      const creature = parsed.creature as Creature
      if (!validateCreature(creature)) return null
      return {
        creatures: [creature],
        activeCreatureId: creature.id,
      }
    }

    return null
  } catch {
    return null
  }
}

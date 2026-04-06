import { openDB, type IDBPDatabase } from 'idb'
import type { Creature } from '../types/creature'

const DB_NAME = 'digi-raise'
const DB_VERSION = 1
const STORE_NAME = 'gameState'
const CREATURE_KEY = 'currentCreature'

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

export async function saveCreature(creature: Creature): Promise<void> {
  try {
    const database = await getDB()
    await database.put(STORE_NAME, creature, CREATURE_KEY)
  } catch (err) {
    console.error('Failed to save creature:', err)
  }
}

export async function loadCreature(): Promise<Creature | null> {
  try {
    const database = await getDB()
    const creature = await database.get(STORE_NAME, CREATURE_KEY)
    return creature ?? null
  } catch (err) {
    console.error('Failed to load creature:', err)
    return null
  }
}

export async function deleteCreature(): Promise<void> {
  try {
    const database = await getDB()
    await database.delete(STORE_NAME, CREATURE_KEY)
  } catch (err) {
    console.error('Failed to delete creature:', err)
  }
}

// File System Access API - Export save
export async function exportSave(creature: Creature): Promise<void> {
  const saveData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    creature,
  }
  const json = JSON.stringify(saveData, null, 2)

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: `digi-raise-save-${creature.name}-${Date.now()}.json`,
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
  a.download = `digi-raise-save-${creature.name}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// File System Access API - Import save
export async function importSave(): Promise<Creature | null> {
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
      const text = await file.text()
      const saveData = JSON.parse(text)
      const creature = saveData.creature ?? null
      if (creature) delete creature.customSprites
      return creature
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
      const text = await file.text()
      try {
        const saveData = JSON.parse(text)
        const creature = saveData.creature ?? null
        if (creature) delete creature.customSprites
        resolve(creature)
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}

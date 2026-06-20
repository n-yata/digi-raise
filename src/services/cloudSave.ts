import type { SaveData } from '../utils/storage'
import { validateSaveData } from '../utils/storage'
import { getFirestoreDb } from './firebase'

export interface CloudSaveData extends SaveData {
  lastSyncedAt: number
}

export type ConflictWinner = 'local' | 'cloud' | 'none'

export function getLocalUpdatedAt(local: SaveData | null): number {
  if (!local || local.creatures.length === 0) return 0
  return Math.max(...local.creatures.map((c) => c.lastUpdated ?? 0))
}

export function resolveConflict(
  local: SaveData | null,
  cloud: CloudSaveData | null,
  localUpdatedAt: number,
): ConflictWinner {
  if (!cloud && !local) return 'none'
  if (!cloud) return 'local'
  if (!local) return 'cloud'
  // 同値はローカル維持（Firestore 書き込み抑制）
  return localUpdatedAt > cloud.lastSyncedAt ? 'local' : 'cloud'
}

export async function pushToCloud(uid: string, saveData: SaveData): Promise<void> {
  const db = await getFirestoreDb()
  if (!db) return

  const sizeEstimate = JSON.stringify(saveData).length
  if (sizeEstimate > 1 * 1024 * 1024) {
    console.error('Save data exceeds 1MB limit, skipping cloud push')
    return
  }

  const { doc, setDoc } = await import('firebase/firestore')
  const ref = doc(db, 'users', uid, 'state', 'saveData')
  await setDoc(ref, { ...saveData, lastSyncedAt: Date.now() })
}

export async function pullFromCloud(uid: string): Promise<CloudSaveData | null> {
  const db = await getFirestoreDb()
  if (!db) return null

  const { doc, getDoc } = await import('firebase/firestore')
  const ref = doc(db, 'users', uid, 'state', 'saveData')
  const snap = await getDoc(ref)

  if (!snap.exists()) return null

  const data = snap.data() as CloudSaveData
  if (!validateSaveData(data)) {
    console.error('Cloud save data failed validation, ignoring')
    return null
  }

  const ts = (data as { lastSyncedAt?: unknown }).lastSyncedAt
  if (typeof ts !== 'number' || !isFinite(ts) || ts < 0) {
    console.error('Cloud save has invalid lastSyncedAt, ignoring')
    return null
  }

  return data
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { pushToCloud, pullFromCloud, resolveConflict, getLocalUpdatedAt } from '../services/cloudSave'
import type { SaveData } from '../utils/storage'
import { saveSaveData } from '../utils/storage'

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'synced'; at: number }
  | { state: 'error'; message: string }

interface UseCloudSaveOptions {
  uid: string | null
  saveData: SaveData | null
  onCloudData: (data: SaveData) => void
}

const DEBOUNCE_MS = 3000

export function useCloudSave({ uid, saveData, onCloudData }: UseCloudSaveOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' })
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isApplyingCloudData = useRef(false)
  const onCloudDataRef = useRef(onCloudData)
  onCloudDataRef.current = onCloudData

  // サインイン時の初回同期
  useEffect(() => {
    if (!uid) return

    async function syncOnSignIn() {
      if (!uid) return
      isApplyingCloudData.current = true
      setSyncStatus({ state: 'syncing' })

      try {
        const [cloud, local] = await Promise.all([
          pullFromCloud(uid),
          Promise.resolve(saveData),
        ])
        const localUpdatedAt = getLocalUpdatedAt(local)
        const winner = resolveConflict(local, cloud, localUpdatedAt)

        console.info(`[CloudSave] conflict resolved: ${winner}`)

        if (winner === 'cloud' && cloud) {
          const { lastSyncedAt: syncedAt, ...cloudSaveData } = cloud
          await saveSaveData(cloudSaveData)
          onCloudDataRef.current(cloudSaveData)
          setLastSyncedAt(syncedAt)
          setSyncStatus({ state: 'synced', at: syncedAt })
        } else if (winner === 'local' && local) {
          await pushToCloud(uid, local)
          const now = Date.now()
          setLastSyncedAt(now)
          setSyncStatus({ state: 'synced', at: now })
        } else {
          setSyncStatus({ state: 'idle' })
        }
      } catch (err) {
        console.error('[CloudSave] syncOnSignIn failed:', err)
        setSyncStatus({ state: 'error', message: '同期に失敗しました' })
      } finally {
        isApplyingCloudData.current = false
      }
    }

    syncOnSignIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // セーブデータ変更時のデバウンス同期
  useEffect(() => {
    if (!uid || !saveData || isApplyingCloudData.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      if (!uid || !saveData) return
      setSyncStatus({ state: 'syncing' })
      try {
        await pushToCloud(uid, saveData)
        const now = Date.now()
        setLastSyncedAt(now)
        setSyncStatus({ state: 'synced', at: now })
      } catch (err) {
        console.error('[CloudSave] push failed:', err)
        setSyncStatus({ state: 'error', message: '同期に失敗しました' })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [uid, saveData])

  const syncNow = useCallback(async () => {
    if (!uid || !saveData) return
    setSyncStatus({ state: 'syncing' })
    try {
      await pushToCloud(uid, saveData)
      const now = Date.now()
      setLastSyncedAt(now)
      setSyncStatus({ state: 'synced', at: now })
    } catch {
      setSyncStatus({ state: 'error', message: '同期に失敗しました' })
    }
  }, [uid, saveData])

  return { syncStatus, lastSyncedAt, syncNow }
}

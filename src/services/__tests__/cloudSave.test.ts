import { describe, it, expect } from 'vitest'
import { resolveConflict, getLocalUpdatedAt } from '../cloudSave'
import type { SaveData } from '../../utils/storage'
import type { CloudSaveData } from '../cloudSave'

const baseCreature = {
  id: 'c1',
  name: 'テスト',
  creatureId: 'fire_a',
  evolutionStage: 1 as const,
  evolutionName: 'ファイア',
  hp: 100,
  maxHp: 100,
  hunger: 80,
  happiness: 80,
  level: 5,
  exp: 200,
  atk: 20,
  def: 15,
  spd: 18,
  weight: 10,
  age: 3,
  isAlive: true,
  isSleeping: false,
  lastUpdated: 1000,
  wins: 0,
  losses: 0,
  feedCount: 0,
  trainCount: 0,
  playCount: 0,
}

const localData: SaveData = {
  creatures: [{ ...baseCreature, lastUpdated: 2000 }],
  activeCreatureId: 'c1',
}

const cloudData: CloudSaveData = {
  creatures: [{ ...baseCreature, lastUpdated: 1000 }],
  activeCreatureId: 'c1',
  lastSyncedAt: 1500,
}

describe('getLocalUpdatedAt', () => {
  it('空のセーブデータは 0 を返す', () => {
    expect(getLocalUpdatedAt(null)).toBe(0)
    expect(getLocalUpdatedAt({ creatures: [], activeCreatureId: null })).toBe(0)
  })

  it('creatures の lastUpdated 最大値を返す', () => {
    const data: SaveData = {
      creatures: [
        { ...baseCreature, id: 'c1', lastUpdated: 1000 },
        { ...baseCreature, id: 'c2', lastUpdated: 3000 },
        { ...baseCreature, id: 'c3', lastUpdated: 2000 },
      ],
      activeCreatureId: 'c1',
    }
    expect(getLocalUpdatedAt(data)).toBe(3000)
  })
})

describe('resolveConflict', () => {
  it('クラウドなし・ローカルあり → local', () => {
    expect(resolveConflict(localData, null, 2000)).toBe('local')
  })

  it('ローカルなし・クラウドあり → cloud', () => {
    expect(resolveConflict(null, cloudData, 0)).toBe('cloud')
  })

  it('双方なし → none', () => {
    expect(resolveConflict(null, null, 0)).toBe('none')
  })

  it('ローカルが新しい → local', () => {
    // localUpdatedAt(2000) > cloud.lastSyncedAt(1500) → local wins
    expect(resolveConflict(localData, cloudData, 2000)).toBe('local')
  })

  it('クラウドが新しい → cloud', () => {
    // localUpdatedAt(1000) <= cloud.lastSyncedAt(1500) → cloud wins
    expect(resolveConflict(localData, cloudData, 1000)).toBe('cloud')
  })

  it('同値はローカル維持（cloud 書き込み抑制）→ cloud', () => {
    // localUpdatedAt === cloud.lastSyncedAt → NOT strictly greater → cloud
    expect(resolveConflict(localData, cloudData, 1500)).toBe('cloud')
  })
})

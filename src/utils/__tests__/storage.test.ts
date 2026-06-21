import { describe, it, expect } from 'vitest'
import { validateSaveData, validateCreature } from '../storage'

// CREATURE_TREE に実在する creatureId を用いた有効なクリーチャー
const validCreature = {
  id: 'c1',
  name: 'プティ',
  creatureId: 'baby',
  evolutionStage: 1,
  hp: 100,
  maxHp: 100,
  atk: 20,
  def: 15,
  spd: 18,
  level: 5,
  exp: 200,
  hunger: 80,
  happiness: 80,
  age: 3,
  weight: 10,
  isAlive: true,
  isSleeping: false,
  lastUpdated: 1000,
  evolutionName: 'プティ',
  totalDeaths: 0,
  trainCount: 0,
  playCount: 0,
  feedCount: 0,
}

const validSave = {
  creatures: [validCreature],
  activeCreatureId: 'c1',
  discoveredCreatures: ['egg', 'baby'],
}

describe('validateCreature', () => {
  it('正常なクリーチャーを受理する', () => {
    expect(validateCreature(validCreature)).toBe(true)
  })

  it('object でない値を拒否する', () => {
    expect(validateCreature(null)).toBe(false)
    expect(validateCreature('string')).toBe(false)
    expect(validateCreature(42)).toBe(false)
  })

  it('未知の creatureId を拒否する', () => {
    expect(validateCreature({ ...validCreature, creatureId: 'unknown_xyz' })).toBe(false)
  })

  it('数値フィールドが NaN / Infinity の場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, hp: NaN })).toBe(false)
    expect(validateCreature({ ...validCreature, atk: Infinity })).toBe(false)
  })

  it('数値フィールドが文字列の場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, level: '5' })).toBe(false)
  })

  it('name が空文字 / 長すぎる場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, name: '' })).toBe(false)
    expect(validateCreature({ ...validCreature, name: 'あ'.repeat(31) })).toBe(false)
  })

  it('evolutionStage が範囲外の場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, evolutionStage: -1 })).toBe(false)
    expect(validateCreature({ ...validCreature, evolutionStage: 6 })).toBe(false)
    expect(validateCreature({ ...validCreature, evolutionStage: 1.5 })).toBe(false)
  })

  it('isAlive / isSleeping が boolean でない場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, isAlive: 'true' })).toBe(false)
    expect(validateCreature({ ...validCreature, isSleeping: 1 })).toBe(false)
  })

  it('lastUpdated が不正な場合は拒否する（競合解決に直結）', () => {
    expect(validateCreature({ ...validCreature, lastUpdated: NaN })).toBe(false)
    expect(validateCreature({ ...validCreature, lastUpdated: '1000' })).toBe(false)
    const { lastUpdated, ...withoutLastUpdated } = validCreature
    void lastUpdated
    expect(validateCreature(withoutLastUpdated)).toBe(false)
  })

  it('必須の集計フィールド（totalDeaths/trainCount/playCount/feedCount）が不正な場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, totalDeaths: '0' })).toBe(false)
    expect(validateCreature({ ...validCreature, trainCount: NaN })).toBe(false)
    expect(validateCreature({ ...validCreature, playCount: Infinity })).toBe(false)
    expect(validateCreature({ ...validCreature, feedCount: undefined })).toBe(false)
  })

  it('evolutionName が文字列でない場合は拒否する', () => {
    expect(validateCreature({ ...validCreature, evolutionName: 123 })).toBe(false)
  })

  it('任意フィールド wins/losses は存在時のみ検証する', () => {
    expect(validateCreature({ ...validCreature, wins: 3, losses: 1 })).toBe(true)
    expect(validateCreature({ ...validCreature, wins: '3' })).toBe(false)
    expect(validateCreature({ ...validCreature, losses: NaN })).toBe(false)
  })

  it('fatigue は任意フィールド: 無くても受理（既存セーブ互換）、存在時のみ検証する', () => {
    // レガシーセーブ（fatigue 欠落）でもロードできる
    expect(validateCreature(validCreature)).toBe(true)
    expect(validateCreature({ ...validCreature, fatigue: 0 })).toBe(true)
    expect(validateCreature({ ...validCreature, fatigue: 60 })).toBe(true)
    // 不正な fatigue は拒否
    expect(validateCreature({ ...validCreature, fatigue: '0' })).toBe(false)
    expect(validateCreature({ ...validCreature, fatigue: NaN })).toBe(false)
  })
})

describe('validateSaveData', () => {
  it('正常なセーブデータを受理する', () => {
    expect(validateSaveData(validSave)).toBe(true)
  })

  it('discoveredCreatures が無くても受理する（任意フィールド）', () => {
    expect(validateSaveData({ creatures: [validCreature], activeCreatureId: 'c1' })).toBe(true)
  })

  it('activeCreatureId が null でも受理する', () => {
    expect(validateSaveData({ creatures: [], activeCreatureId: null })).toBe(true)
  })

  it('object でない値を拒否する', () => {
    expect(validateSaveData(null)).toBe(false)
    expect(validateSaveData('corrupt')).toBe(false)
  })

  it('creatures が配列でない場合は拒否する', () => {
    expect(validateSaveData({ creatures: 'nope', activeCreatureId: null })).toBe(false)
  })

  it('creatures に不正な要素が含まれる場合は拒否する', () => {
    expect(validateSaveData({ creatures: [validCreature, { broken: true }], activeCreatureId: 'c1' })).toBe(false)
  })

  it('creatures が 50 件を超える場合は拒否する', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ ...validCreature, id: `c${i}` }))
    expect(validateSaveData({ creatures: many, activeCreatureId: 'c0' })).toBe(false)
  })

  it('activeCreatureId が creatures に存在しない場合は拒否する', () => {
    expect(validateSaveData({ creatures: [validCreature], activeCreatureId: 'ghost' })).toBe(false)
  })

  it('discoveredCreatures に未知の id が含まれる場合は拒否する', () => {
    expect(validateSaveData({ creatures: [validCreature], activeCreatureId: 'c1', discoveredCreatures: ['unknown'] })).toBe(false)
  })
})

import type { Creature, EvolutionStage } from '../types/creature'
import { CREATURE_TREE, BASE_STATS, EXP_TO_LEVEL } from '../data/evolutions'

// ── 成長レート定数（ハードコーディング集約） ──
// 時間更新は 30分/ティック（本番）。24h = 48 ティック。
export const TICKS_PER_DAY = 48
/** 1 実日 = +1 歳。1 ティックあたりの加齢量（≈0.02083）。 */
export const AGE_PER_TICK = 1 / TICKS_PER_DAY
/** おなかは時間経過のみで減少。約8時間（16ティック）で 100→0（=6.25/ティック）。 */
export const HUNGER_DECAY_PER_TICK = 100 / (8 * 2)

// ── 疲労度（裏パラメータ 0–100） ──
/** 疲労度の上限。これ以上はトレ/遊ぶ不可。 */
export const FATIGUE_MAX = 100
/** トレーニング1回で蓄積する疲労。 */
export const FATIGUE_TRAIN_COST = 15
/** 遊ぶ1回で蓄積する疲労。 */
export const FATIGUE_PLAY_COST = 10
/** この値以上で「疲労中」モーションを表示する。 */
export const TIRED_THRESHOLD = 60
/** 1 ティックあたりの疲労回復量。約3時間（6ティック）で全回復（≈16.67/ティック）。 */
export const FATIGUE_RECOVERY_PER_TICK = 100 / (3 * 2)

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
    fatigue: 0,
    age: 0,
    weight: 10,
    isSleeping: false,
    lightsOn: true,
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
 * 疲労度が MAX のときは実行できない（no-op）。おなかは消費しない（疲労を蓄積する）。
 */
export function trainCreature(creature: Creature, taps: number = 0): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  if (creature.fatigue >= FATIGUE_MAX) return creature
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
      fatigue: Math.min(FATIGUE_MAX, (creature.fatigue ?? 0) + FATIGUE_TRAIN_COST),
      happiness: Math.max(0, creature.happiness - 5),
      trainCount: creature.trainCount + 1,
    },
    expGain
  )
  return { ...updated, lastUpdated: Date.now() }
}

/**
 * 遊ぶ。幸福度を上げる。疲労度が MAX のときは実行できない（no-op）。
 * おなかは消費しない（疲労を蓄積する）。
 */
export function playWithCreature(creature: Creature, success: boolean = true): Creature {
  if (!creature.isAlive || creature.isSleeping) return creature
  if (creature.fatigue >= FATIGUE_MAX) return creature
  return {
    ...creature,
    happiness: Math.min(100, creature.happiness + (success ? 20 : 5)),
    fatigue: Math.min(FATIGUE_MAX, (creature.fatigue ?? 0) + FATIGUE_PLAY_COST),
    playCount: creature.playCount + 1,
    lastUpdated: Date.now(),
  }
}

/** 部屋の照明が ON か。未指定（既存セーブ）は ON 扱い。 */
export function isLightsOn(creature: Creature): boolean {
  return creature.lightsOn ?? true
}

/**
 * 実時刻が「夜」（自動睡眠の時間帯）かを判定する。
 * 夜は 22:00〜翌 6:00。引数を省略すると現在時刻で判定する。
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours()
  return hour >= 22 || hour < 6
}

/** 部屋の照明 ON/OFF を切り替える。 */
export function toggleLights(creature: Creature): Creature {
  if (!creature.isAlive) return creature
  return {
    ...creature,
    lightsOn: !isLightsOn(creature),
    lastUpdated: Date.now(),
  }
}

export function applyTimeUpdate(creature: Creature, devMode: boolean): Creature {
  if (!creature.isAlive) return creature

  const now = Date.now()
  const night = isNightTime(new Date(now))
  const lightsOn = isLightsOn(creature)

  const elapsed = now - creature.lastUpdated
  const thirtyMinutes = devMode ? 1000 * 30 : 1000 * 60 * 30

  const thirtyMinTicks = Math.floor(elapsed / thirtyMinutes)

  // 経過ティックが無くても睡眠状態だけは実時刻へ同期する
  if (thirtyMinTicks === 0) {
    return creature.isSleeping === night ? creature : { ...creature, isSleeping: night }
  }

  let updated = { ...creature, isSleeping: night }

  // おなかは時間経過のみで減少（約8時間で 100→0）
  updated.hunger = Math.max(0, updated.hunger - thirtyMinTicks * HUNGER_DECAY_PER_TICK)

  // 疲労度は時間経過で常時回復（約3時間で全回復）。既存セーブ（undefined）は 0 起点。
  updated.fatigue = Math.max(0, (updated.fatigue ?? 0) - thirtyMinTicks * FATIGUE_RECOVERY_PER_TICK)

  // 通常の幸福度減少 + 照明ミスマッチの追加ペナルティ。
  //  - 夜（睡眠中）に電気 ON のまま: 眩しくて眠れない
  //  - 日中（起床中）に電気 OFF のまま: 暗くて不快
  const lightMismatch = night ? lightsOn : !lightsOn
  const happinessLoss = thirtyMinTicks * (lightMismatch ? 5 : 2)
  updated.happiness = Math.max(0, updated.happiness - happinessLoss)

  // 年齢は現実1日で +1 歳（48ティック=24h で +1。float。表示は Math.floor）
  updated.age = updated.age + thirtyMinTicks * AGE_PER_TICK

  // HP回復は「夜 ＋ 電気OFF」で快適に眠れているときのみ
  if (night && !lightsOn) {
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
): 'idle' | 'happy' | 'sleeping' | 'attack' | 'eating' | 'evolving' | 'dead' | 'sad' | 'hungry' | 'critical' | 'tired' {
  if (!creature.isAlive) return 'dead'
  // 明示アクション（ごはん/遊び/トレ）はその場で即フィードバック。dead 以外より優先。
  if (actionOverride) return actionOverride
  if (creature.isSleeping) return 'sleeping'
  if (creature.hp <= creature.maxHp * 0.2) return 'critical'
  if (creature.hunger <= 20) return 'hungry'
  // 疲労中（裏パラメータ）。空腹より下・不機嫌より上の優先度で表現する。
  if ((creature.fatigue ?? 0) >= TIRED_THRESHOLD) return 'tired'
  if (creature.happiness <= 30) return 'sad'
  if (creature.happiness > 70) return 'happy'
  return 'idle'
}

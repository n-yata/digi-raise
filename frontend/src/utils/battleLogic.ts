import type { CreatureSnapshot, BattleAction, BattleRole } from '../types/battle'

// タイプ相性マトリクス
// Fire/Water/Plant/Thunder/Dark/Light
export const TYPE_ADVANTAGE: Record<string, Record<string, number>> = {
  Fire:    { Fire: 1.0, Water: 0.8, Plant: 1.2, Thunder: 1.0, Dark: 1.0, Light: 1.0 },
  Water:   { Fire: 1.2, Water: 1.0, Plant: 0.8, Thunder: 1.0, Dark: 1.0, Light: 1.0 },
  Plant:   { Fire: 0.8, Water: 1.2, Plant: 1.0, Thunder: 1.0, Dark: 1.0, Light: 1.0 },
  Thunder: { Fire: 1.0, Water: 1.2, Plant: 1.0, Thunder: 1.0, Dark: 0.8, Light: 1.2 },
  Dark:    { Fire: 1.0, Water: 1.0, Plant: 1.0, Thunder: 1.2, Dark: 1.0, Light: 0.8 },
  Light:   { Fire: 1.0, Water: 1.0, Plant: 1.0, Thunder: 0.8, Dark: 1.2, Light: 1.0 },
}

// シード付き擬似乱数（LCG）
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = ((state * 1664525 + 1013904223) & 0xFFFFFFFF) >>> 0
    return state / 0xFFFFFFFF
  }
}

// ダメージ計算
export function calcDamage(
  attacker: CreatureSnapshot,
  defender: CreatureSnapshot,
  defenderGuarding: boolean
): number {
  const baseDamage = attacker.atk * 1.5 - defender.def * (defenderGuarding ? 1.6 : 0.8)
  const typeMod = (TYPE_ADVANTAGE[attacker.type]?.[defender.type]) ?? 1.0
  const spdMod = attacker.spd > defender.spd ? 1.1 : 0.9
  return Math.max(1, Math.floor(baseDamage * typeMod * spdMod))
}

export interface SpecialResult {
  damage: number
  selfHeal: number
  poisonTurns: number
  paralyzed: boolean
  atkDebuffTurns: number
  defBuffTurns: number
}

// 特殊アクション効果（タイプ別）
export function calcSpecial(
  attacker: CreatureSnapshot,
  _defender: CreatureSnapshot,
  rng: () => number
): SpecialResult {
  const base: SpecialResult = {
    damage: 0,
    selfHeal: 0,
    poisonTurns: 0,
    paralyzed: false,
    atkDebuffTurns: 0,
    defBuffTurns: 0,
  }

  switch (attacker.type) {
    case 'Fire':
      // 高火力攻撃
      return {
        ...base,
        damage: Math.floor(attacker.atk * 2.5),
      }
    case 'Water':
      // 自己回復
      return {
        ...base,
        selfHeal: Math.floor(attacker.maxHp * 0.3),
      }
    case 'Plant':
      // 毒付与（3ターン）
      return {
        ...base,
        damage: Math.floor(attacker.atk * 0.8),
        poisonTurns: 3,
      }
    case 'Thunder':
      // 麻痺付与（50%確率）
      return {
        ...base,
        damage: Math.floor(attacker.atk * 1.2),
        paralyzed: rng() < 0.5,
      }
    case 'Dark':
      // ATKデバフ（2ターン）
      return {
        ...base,
        damage: Math.floor(attacker.atk * 1.0),
        atkDebuffTurns: 2,
      }
    case 'Light':
      // DEFバフ（自分）
      return {
        ...base,
        damage: Math.floor(attacker.atk * 0.5),
        defBuffTurns: 2,
      }
    default:
      return {
        ...base,
        damage: Math.floor(attacker.atk * 1.5),
      }
  }
}

export interface TurnResolution {
  myHpAfter: number
  opponentHpAfter: number
  myPoisonTurns: number
  opponentPoisonTurns: number
  myParalyzed: boolean
  opponentParalyzed: boolean
  myDefBuff: number
  opponentDefBuff: number
  myAtkDebuff: boolean
  opponentAtkDebuff: boolean
  logMessages: string[]
}

export function resolveTurn(
  myCreature: CreatureSnapshot,
  opponentCreature: CreatureSnapshot,
  myAction: BattleAction,
  opponentAction: BattleAction,
  myRole: BattleRole,
  seed: number,
  currentEffects: {
    myPoisonTurns: number
    opponentPoisonTurns: number
    myParalyzed: boolean
    opponentParalyzed: boolean
    myDefBuff: number
    opponentDefBuff: number
    specialCooldown: number
    opponentSpecialCooldown: number
  }
): TurnResolution {
  const rng = createRng(seed)
  const log: string[] = []

  let myHp = myCreature.hp
  let opponentHp = opponentCreature.hp
  let myPoisonTurns = currentEffects.myPoisonTurns
  let opponentPoisonTurns = currentEffects.opponentPoisonTurns
  let myParalyzed = currentEffects.myParalyzed
  let opponentParalyzed = currentEffects.opponentParalyzed
  let myDefBuff = currentEffects.myDefBuff
  let opponentDefBuff = currentEffects.opponentDefBuff
  let myAtkDebuff = false
  let opponentAtkDebuff = false

  // 麻痺チェック
  const myActuallyActs = !myParalyzed || rng() > 0.5
  const opponentActuallyActs = !opponentParalyzed || rng() > 0.5

  if (myParalyzed && !myActuallyActs) {
    log.push(`${myCreature.name}は麻痺して動けない！`)
  }
  if (opponentParalyzed && !opponentActuallyActs) {
    log.push(`${opponentCreature.name}は麻痺して動けない！`)
  }

  // DEFバフ適用したスナップショット
  const myEffectiveDef = myDefBuff > 0 ? Math.floor(myCreature.def * 1.5) : myCreature.def
  const opponentEffectiveDef = opponentDefBuff > 0 ? Math.floor(opponentCreature.def * 1.5) : opponentCreature.def

  const mySnap: CreatureSnapshot = { ...myCreature, def: myEffectiveDef }
  const opponentSnap: CreatureSnapshot = { ...opponentCreature, def: opponentEffectiveDef }

  // ホストが先手かゲストが先手かはSPDで決定
  const myGoesFirst = myRole === 'host'
    ? myCreature.spd >= opponentCreature.spd
    : myCreature.spd > opponentCreature.spd

  const processAction = (
    actorName: string,
    actor: CreatureSnapshot,
    target: CreatureSnapshot,
    action: BattleAction,
    actorActuallyActs: boolean,
    isMyAction: boolean,
    specialCooldown: number
  ): { actorHeal: number; targetDamage: number; newPoisonOnTarget: number; newParalyzedTarget: boolean; newAtkDebuffOnTarget: boolean; newDefBuffOnActor: number } => {
    if (!actorActuallyActs) {
      return { actorHeal: 0, targetDamage: 0, newPoisonOnTarget: 0, newParalyzedTarget: false, newAtkDebuffOnTarget: false, newDefBuffOnActor: 0 }
    }

    if (action === 'guard') {
      log.push(`${actorName}はガード！`)
      return { actorHeal: 0, targetDamage: 0, newPoisonOnTarget: 0, newParalyzedTarget: false, newAtkDebuffOnTarget: false, newDefBuffOnActor: 0 }
    }

    if (action === 'attack') {
      const targetGuarding = isMyAction ? opponentAction === 'guard' : myAction === 'guard'
      const dmg = calcDamage(actor, target, targetGuarding)
      log.push(`${actorName}の攻撃！ ${dmg}ダメージ！`)
      return { actorHeal: 0, targetDamage: dmg, newPoisonOnTarget: 0, newParalyzedTarget: false, newAtkDebuffOnTarget: false, newDefBuffOnActor: 0 }
    }

    if (action === 'special') {
      if (specialCooldown > 0) {
        // クールダウン中はattackにフォールバック
        const targetGuarding = isMyAction ? opponentAction === 'guard' : myAction === 'guard'
        const dmg = calcDamage(actor, target, targetGuarding)
        log.push(`${actorName}の攻撃！ ${dmg}ダメージ！`)
        return { actorHeal: 0, targetDamage: dmg, newPoisonOnTarget: 0, newParalyzedTarget: false, newAtkDebuffOnTarget: false, newDefBuffOnActor: 0 }
      }
      const result = calcSpecial(actor, target, rng)
      if (result.damage > 0) log.push(`${actorName}の特殊技！ ${result.damage}ダメージ！`)
      if (result.selfHeal > 0) log.push(`${actorName}は${result.selfHeal}HP回復！`)
      if (result.poisonTurns > 0) log.push(`${target.name}は毒を受けた！`)
      if (result.paralyzed) log.push(`${target.name}は麻痺した！`)
      if (result.atkDebuffTurns > 0) log.push(`${target.name}のATKが下がった！`)
      if (result.defBuffTurns > 0) log.push(`${actorName}のDEFが上がった！`)
      return {
        actorHeal: result.selfHeal,
        targetDamage: result.damage,
        newPoisonOnTarget: result.poisonTurns,
        newParalyzedTarget: result.paralyzed,
        newAtkDebuffOnTarget: result.atkDebuffTurns > 0,
        newDefBuffOnActor: result.defBuffTurns,
      }
    }

    return { actorHeal: 0, targetDamage: 0, newPoisonOnTarget: 0, newParalyzedTarget: false, newAtkDebuffOnTarget: false, newDefBuffOnActor: 0 }
  }

  // ターン処理（先手→後手）
  const firstIsMe = myGoesFirst
  const firstAction = firstIsMe ? myAction : opponentAction
  const secondAction = firstIsMe ? opponentAction : myAction
  const firstActor = firstIsMe ? mySnap : opponentSnap
  const secondActor = firstIsMe ? opponentSnap : mySnap
  const firstActuallyActs = firstIsMe ? myActuallyActs : opponentActuallyActs
  const secondActuallyActs = firstIsMe ? opponentActuallyActs : myActuallyActs
  const firstCooldown = firstIsMe ? currentEffects.specialCooldown : currentEffects.opponentSpecialCooldown
  const secondCooldown = firstIsMe ? currentEffects.opponentSpecialCooldown : currentEffects.specialCooldown

  const firstResult = processAction(
    firstActor.name, firstActor, secondActor, firstAction, firstActuallyActs, firstIsMe, firstCooldown
  )
  if (firstIsMe) {
    myHp += firstResult.actorHeal
    opponentHp -= firstResult.targetDamage
    if (firstResult.newPoisonOnTarget > 0) opponentPoisonTurns = firstResult.newPoisonOnTarget
    if (firstResult.newParalyzedTarget) opponentParalyzed = true
    if (firstResult.newAtkDebuffOnTarget) opponentAtkDebuff = true
    if (firstResult.newDefBuffOnActor > 0) myDefBuff = firstResult.newDefBuffOnActor
  } else {
    opponentHp += firstResult.actorHeal
    myHp -= firstResult.targetDamage
    if (firstResult.newPoisonOnTarget > 0) myPoisonTurns = firstResult.newPoisonOnTarget
    if (firstResult.newParalyzedTarget) myParalyzed = true
    if (firstResult.newAtkDebuffOnTarget) myAtkDebuff = true
    if (firstResult.newDefBuffOnActor > 0) opponentDefBuff = firstResult.newDefBuffOnActor
  }

  // 先手で相手が倒れても後手は動く（デジモン風）
  const secondResult = processAction(
    secondActor.name, secondActor, firstActor, secondAction, secondActuallyActs, !firstIsMe, secondCooldown
  )
  if (!firstIsMe) {
    myHp += secondResult.actorHeal
    opponentHp -= secondResult.targetDamage
    if (secondResult.newPoisonOnTarget > 0) opponentPoisonTurns = secondResult.newPoisonOnTarget
    if (secondResult.newParalyzedTarget) opponentParalyzed = true
    if (secondResult.newAtkDebuffOnTarget) opponentAtkDebuff = true
    if (secondResult.newDefBuffOnActor > 0) myDefBuff = secondResult.newDefBuffOnActor
  } else {
    opponentHp += secondResult.actorHeal
    myHp -= secondResult.targetDamage
    if (secondResult.newPoisonOnTarget > 0) myPoisonTurns = secondResult.newPoisonOnTarget
    if (secondResult.newParalyzedTarget) myParalyzed = true
    if (secondResult.newAtkDebuffOnTarget) myAtkDebuff = true
    if (secondResult.newDefBuffOnActor > 0) opponentDefBuff = secondResult.newDefBuffOnActor
  }

  // 毒ダメージ
  if (myPoisonTurns > 0) {
    const poisonDmg = Math.max(1, Math.floor(myCreature.maxHp * 0.05))
    myHp -= poisonDmg
    myPoisonTurns--
    log.push(`${myCreature.name}は毒で${poisonDmg}ダメージ！`)
  }
  if (opponentPoisonTurns > 0) {
    const poisonDmg = Math.max(1, Math.floor(opponentCreature.maxHp * 0.05))
    opponentHp -= poisonDmg
    opponentPoisonTurns--
    log.push(`${opponentCreature.name}は毒で${poisonDmg}ダメージ！`)
  }

  // 麻痺は1ターン後に回復
  if (myParalyzed && currentEffects.myParalyzed) myParalyzed = false
  if (opponentParalyzed && currentEffects.opponentParalyzed) opponentParalyzed = false

  // DEFバフターン減算
  if (myDefBuff > 0) myDefBuff--
  if (opponentDefBuff > 0) opponentDefBuff--

  return {
    myHpAfter: Math.max(0, myHp),
    opponentHpAfter: Math.max(0, opponentHp),
    myPoisonTurns,
    opponentPoisonTurns,
    myParalyzed,
    opponentParalyzed,
    myDefBuff,
    opponentDefBuff,
    myAtkDebuff,
    opponentAtkDebuff,
    logMessages: log,
  }
}

import { describe, it, expect } from 'vitest'
import type { CreatureSnapshot } from '../types/battle'
import {
  createRng,
  TYPE_ADVANTAGE,
  calcDamage,
  calcSpecial,
  resolveTurn,
} from './battleLogic'

// テスト用ヘルパー
function makeCreature(overrides: Partial<CreatureSnapshot> = {}): CreatureSnapshot {
  return {
    name: 'テストモン',
    evolutionStage: 3,
    type: 'Fire',
    hp: 100,
    maxHp: 100,
    atk: 20,
    def: 10,
    spd: 15,
    level: 5,
    ...overrides,
  }
}

// resolveTurn のデフォルト currentEffects
function makeEffects(overrides: Partial<Parameters<typeof resolveTurn>[7]> = {}) {
  return {
    myPoisonTurns: 0,
    opponentPoisonTurns: 0,
    myParalyzed: false,
    opponentParalyzed: false,
    myDefBuff: 0,
    opponentDefBuff: 0,
    specialCooldown: 0,
    opponentSpecialCooldown: 0,
    ...overrides,
  }
}

// ----------------------------------------------------------------
// 1. createRng
// ----------------------------------------------------------------
describe('createRng', () => {
  it('同じシードを与えると毎回同じ値の列を返す', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
  })

  it('異なるシードでは異なる値を返す', () => {
    const rng42 = createRng(42)
    const rng100 = createRng(100)
    // 最初の値が異なることを確認
    expect(rng42()).not.toBe(rng100())
  })

  it('返り値が [0, 1) の範囲に収まる', () => {
    const rng = createRng(1234)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('シード42の最初の3値が仕様通りの値になる', () => {
    const rng = createRng(42)
    expect(rng()).toBeCloseTo(0.25234517484259444, 10)
    expect(rng()).toBeCloseTo(0.08812504543180695, 10)
    expect(rng()).toBeCloseTo(0.5772811983659121, 10)
  })
})

// ----------------------------------------------------------------
// 2. TYPE_ADVANTAGE
// ----------------------------------------------------------------
describe('TYPE_ADVANTAGE', () => {
  it('Fireの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Fire.Fire).toBe(1.0)
    expect(TYPE_ADVANTAGE.Fire.Water).toBe(0.8)
    expect(TYPE_ADVANTAGE.Fire.Plant).toBe(1.2)
    expect(TYPE_ADVANTAGE.Fire.Thunder).toBe(1.0)
    expect(TYPE_ADVANTAGE.Fire.Dark).toBe(1.0)
    expect(TYPE_ADVANTAGE.Fire.Light).toBe(1.0)
  })

  it('Waterの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Water.Fire).toBe(1.2)
    expect(TYPE_ADVANTAGE.Water.Water).toBe(1.0)
    expect(TYPE_ADVANTAGE.Water.Plant).toBe(0.8)
    expect(TYPE_ADVANTAGE.Water.Thunder).toBe(1.0)
    expect(TYPE_ADVANTAGE.Water.Dark).toBe(1.0)
    expect(TYPE_ADVANTAGE.Water.Light).toBe(1.0)
  })

  it('Plantの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Plant.Fire).toBe(0.8)
    expect(TYPE_ADVANTAGE.Plant.Water).toBe(1.2)
    expect(TYPE_ADVANTAGE.Plant.Plant).toBe(1.0)
    expect(TYPE_ADVANTAGE.Plant.Thunder).toBe(1.0)
    expect(TYPE_ADVANTAGE.Plant.Dark).toBe(1.0)
    expect(TYPE_ADVANTAGE.Plant.Light).toBe(1.0)
  })

  it('Thunderの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Thunder.Fire).toBe(1.0)
    expect(TYPE_ADVANTAGE.Thunder.Water).toBe(1.2)
    expect(TYPE_ADVANTAGE.Thunder.Plant).toBe(1.0)
    expect(TYPE_ADVANTAGE.Thunder.Thunder).toBe(1.0)
    expect(TYPE_ADVANTAGE.Thunder.Dark).toBe(0.8)
    expect(TYPE_ADVANTAGE.Thunder.Light).toBe(1.2)
  })

  it('Darkの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Dark.Fire).toBe(1.0)
    expect(TYPE_ADVANTAGE.Dark.Water).toBe(1.0)
    expect(TYPE_ADVANTAGE.Dark.Plant).toBe(1.0)
    expect(TYPE_ADVANTAGE.Dark.Thunder).toBe(1.2)
    expect(TYPE_ADVANTAGE.Dark.Dark).toBe(1.0)
    expect(TYPE_ADVANTAGE.Dark.Light).toBe(0.8)
  })

  it('Lightの相性が仕様通りの値になる', () => {
    expect(TYPE_ADVANTAGE.Light.Fire).toBe(1.0)
    expect(TYPE_ADVANTAGE.Light.Water).toBe(1.0)
    expect(TYPE_ADVANTAGE.Light.Plant).toBe(1.0)
    expect(TYPE_ADVANTAGE.Light.Thunder).toBe(0.8)
    expect(TYPE_ADVANTAGE.Light.Dark).toBe(1.2)
    expect(TYPE_ADVANTAGE.Light.Light).toBe(1.0)
  })
})

// ----------------------------------------------------------------
// 3. calcDamage
// ----------------------------------------------------------------
describe('calcDamage', () => {
  it('基本ダメージ計算が正しい (atk*1.5 - def*0.8, 先手×1.1)', () => {
    // atk=20, def=10: base=20*1.5-10*0.8=22
    // Fire vs Fire: typeMod=1.0, spd attacker(15)>defender(10) → spdMod=1.1
    // floor(22 * 1.0 * 1.1) = 24
    const attacker = makeCreature({ spd: 15 })
    const defender = makeCreature({ spd: 10 })
    expect(calcDamage(attacker, defender, false)).toBe(24)
  })

  it('後手補正が正しい (×0.9)', () => {
    // attacker.spd(10) <= defender.spd(15) → spdMod=0.9
    // floor(22 * 1.0 * 0.9) = 19
    const attacker = makeCreature({ spd: 10 })
    const defender = makeCreature({ spd: 15 })
    expect(calcDamage(attacker, defender, false)).toBe(19)
  })

  it('ガード時は def*1.6 で計算される', () => {
    // base = 20*1.5 - 10*1.6 = 14, spdMod=1.1
    // floor(14 * 1.0 * 1.1) = 15
    const attacker = makeCreature({ spd: 15 })
    const defender = makeCreature({ spd: 10 })
    expect(calcDamage(attacker, defender, true)).toBe(15)
  })

  it('タイプ有利 (×1.2) が正しく乗算される', () => {
    // Water vs Fire: typeMod=1.2, base=22, spdMod=1.1
    // floor(22 * 1.2 * 1.1) = 29
    const attacker = makeCreature({ type: 'Water', spd: 15 })
    const defender = makeCreature({ type: 'Fire', spd: 10 })
    expect(calcDamage(attacker, defender, false)).toBe(29)
  })

  it('タイプ不利 (×0.8) が正しく乗算される', () => {
    // Fire vs Water: typeMod=0.8, base=22, spdMod=1.1
    // floor(22 * 0.8 * 1.1) = 19
    const attacker = makeCreature({ type: 'Fire', spd: 15 })
    const defender = makeCreature({ type: 'Water', spd: 10 })
    expect(calcDamage(attacker, defender, false)).toBe(19)
  })

  it('最低ダメージは1になる (baseDamageが負になっても)', () => {
    // atk=1, def=100: base=1*1.5-100*0.8=-78.5 → max(1, floor(-78.5*...)) = 1
    const attacker = makeCreature({ atk: 1, spd: 10 })
    const defender = makeCreature({ def: 100, spd: 15 })
    expect(calcDamage(attacker, defender, false)).toBe(1)
  })

  it('結果が Math.floor される (小数にならない)', () => {
    const attacker = makeCreature({ spd: 15 })
    const defender = makeCreature({ spd: 10 })
    const result = calcDamage(attacker, defender, false)
    expect(Number.isInteger(result)).toBe(true)
  })
})

// ----------------------------------------------------------------
// 4. calcSpecial
// ----------------------------------------------------------------
describe('calcSpecial', () => {
  const dummyRng = () => 0.1 // paralyzed判定に確実にtrueを返す固定値

  it('Fire: atk*2.5 のダメージ, selfHeal=0, poisonTurns=0 になる', () => {
    const attacker = makeCreature({ type: 'Fire', atk: 20 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(20*2.5) = 50
    expect(result.damage).toBe(50)
    expect(result.selfHeal).toBe(0)
    expect(result.poisonTurns).toBe(0)
    expect(result.paralyzed).toBe(false)
    expect(result.atkDebuffTurns).toBe(0)
    expect(result.defBuffTurns).toBe(0)
  })

  it('Water: selfHeal = floor(maxHp*0.3), damage=0 になる', () => {
    const attacker = makeCreature({ type: 'Water', maxHp: 100 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(100*0.3) = 30
    expect(result.selfHeal).toBe(30)
    expect(result.damage).toBe(0)
  })

  it('Plant: damage > 0 かつ poisonTurns=3 になる', () => {
    const attacker = makeCreature({ type: 'Plant', atk: 20 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(20*0.8) = 16
    expect(result.damage).toBe(16)
    expect(result.poisonTurns).toBe(3)
  })

  it('Thunder: damage > 0 かつ rng() < 0.5 のときに paralyzed=true になる', () => {
    const attacker = makeCreature({ type: 'Thunder', atk: 20 })
    const defender = makeCreature()
    // rng() = 0.1 → 0.1 < 0.5 → paralyzed=true
    const lowRng = () => 0.1
    const result = calcSpecial(attacker, defender, lowRng)
    // floor(20*1.2) = 24
    expect(result.damage).toBe(24)
    expect(result.paralyzed).toBe(true)
  })

  it('Thunder: rng() >= 0.5 のときに paralyzed=false になる', () => {
    const attacker = makeCreature({ type: 'Thunder', atk: 20 })
    const defender = makeCreature()
    // rng() = 0.7 → 0.7 >= 0.5 → paralyzed=false
    const highRng = () => 0.7
    const result = calcSpecial(attacker, defender, highRng)
    expect(result.paralyzed).toBe(false)
  })

  it('Dark: damage > 0 かつ atkDebuffTurns=2 になる', () => {
    const attacker = makeCreature({ type: 'Dark', atk: 20 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(20*1.0) = 20
    expect(result.damage).toBe(20)
    expect(result.atkDebuffTurns).toBe(2)
  })

  it('Light: damage > 0 かつ defBuffTurns=2 になる', () => {
    const attacker = makeCreature({ type: 'Light', atk: 20 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(20*0.5) = 10
    expect(result.damage).toBe(10)
    expect(result.defBuffTurns).toBe(2)
  })

  it('未知タイプ: フォールバックダメージ (atk*1.5) > 0 になる', () => {
    const attacker = makeCreature({ type: 'Unknown', atk: 20 })
    const defender = makeCreature()
    const result = calcSpecial(attacker, defender, dummyRng)
    // floor(20*1.5) = 30
    expect(result.damage).toBe(30)
  })
})

// ----------------------------------------------------------------
// 5. resolveTurn
// ----------------------------------------------------------------
describe('resolveTurn', () => {
  it('attack vs attack: 両者が互いにダメージを与える', () => {
    // my: Fire, spd=15 (先手, host)
    // opponent: Fire, spd=10 (後手)
    // 先手(my) → opponent: floor((20*1.5-10*0.8)*1.0*1.1) = 24
    // 後手(opponent) → my: floor((20*1.5-10*0.8)*1.0*0.9) = 19
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    expect(result.myHpAfter).toBe(81)       // 100 - 19
    expect(result.opponentHpAfter).toBe(76) // 100 - 24
  })

  it('attack vs guard: ガード側のダメージが減少する', () => {
    // my attacks, opponent guards
    // ガードあり: base = 20*1.5-10*1.6=14, typeMod=1.0, spdMod=1.1 → floor(14*1.1)=15
    // opponent → my (not guarding): floor(22*0.9)=19
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const normalResult = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    const guardResult = resolveTurn(my, opponent, 'attack', 'guard', 'host', 0, makeEffects())
    // ガード時は相手へのダメージが少ない
    expect(guardResult.opponentHpAfter).toBeGreaterThan(normalResult.opponentHpAfter)
    expect(guardResult.opponentHpAfter).toBe(85) // 100 - 15
  })

  it('special (Plant/毒): opponentPoisonTurns が設定され毒ダメージ後に 2 になる', () => {
    // Plant special で poisonTurns=3 が設定 → 同ターン内に毒ダメージで 1 減算 → 2
    const my = makeCreature({ type: 'Plant', spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 0, makeEffects())
    expect(result.opponentPoisonTurns).toBe(2)
  })

  it('Plant special の後に毒ダメージがそのターン中に発動し opponentHp が減る', () => {
    // Plant special: damage=floor(20*0.8)=16 → opponentHp=84
    // 毒ダメージ: floor(100*0.05)=5 → opponentHp=79
    // opponent(Fire) が my(Plant) を攻撃: Fire vs Plant typeMod=1.2, spdMod=0.9
    //   floor(22 * 1.2 * 0.9) = floor(23.76) = 23 → myHp=77
    const my = makeCreature({ type: 'Plant', spd: 15 })
    const opponent = makeCreature({ type: 'Fire', spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 0, makeEffects())
    expect(result.myHpAfter).toBe(77)
    expect(result.opponentHpAfter).toBe(79)
    // ターン後の毒ターン数は 3-1=2
    expect(result.opponentPoisonTurns).toBe(2)
  })

  it('毒ターン継続: myPoisonTurns=2 を渡すと HP が減り、ターン数が 1 減る', () => {
    // 毒ダメージ: floor(100*0.05)=5
    // myHp: 100 - 19(opponent attack) - 5(poison) = 76
    // myPoisonTurns: 2-1=1
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(
      my, opponent, 'attack', 'attack', 'host', 0,
      makeEffects({ myPoisonTurns: 2 })
    )
    expect(result.myHpAfter).toBe(76)
    expect(result.myPoisonTurns).toBe(1)
  })

  it('麻痺(myParalyzed=true): seed=1 のとき行動不可になり my からのダメージが 0 になる', () => {
    // seed=1 → rng1=0.236... ≤ 0.5 → myActuallyActs=false
    // my は行動不可 → opponentHp 変化なし
    // opponent は行動 → myHp 減少
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(
      my, opponent, 'attack', 'attack', 'host', 1,
      makeEffects({ myParalyzed: true })
    )
    expect(result.opponentHpAfter).toBe(100) // my が行動できない
    expect(result.myHpAfter).toBe(81)        // opponent の攻撃は通る (100-19)
  })

  it('麻痺(myParalyzed=true): seed=999 のとき行動可能になり両者ダメージが発生する', () => {
    // seed=999 → rng1=0.623... > 0.5 → myActuallyActs=true
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(
      my, opponent, 'attack', 'attack', 'host', 999,
      makeEffects({ myParalyzed: true })
    )
    expect(result.opponentHpAfter).toBe(76) // my が攻撃できる
    expect(result.myHpAfter).toBe(81)       // opponent も攻撃
  })

  it('DEFバフ(myDefBuff=2): my の DEF が 1.5 倍で計算され被ダメージが減る', () => {
    // effectiveDef = floor(10*1.5) = 15
    // opponent → my: base = 20*1.5-15*0.8=18, spdMod=0.9 → floor(18*0.9)=16
    // myHp = 100-16 = 84 (バフなしは 100-19=81)
    const my = makeCreature({ spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const noBuff = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    const withBuff = resolveTurn(
      my, opponent, 'attack', 'attack', 'host', 0,
      makeEffects({ myDefBuff: 2 })
    )
    expect(withBuff.myHpAfter).toBeGreaterThan(noBuff.myHpAfter)
    expect(withBuff.myHpAfter).toBe(84)
    // バフターン数は 1 減って 1 になる
    expect(withBuff.myDefBuff).toBe(1)
  })

  it('先手補正: spd が高い方が先手(×1.1)になる (host 側)', () => {
    // my: spd=20, opponent: spd=10 → my先手 → my が ×1.1, opponent が ×0.9
    const my = makeCreature({ atk: 20, def: 10, spd: 20 })
    const opponent = makeCreature({ atk: 20, def: 10, spd: 10 })
    const result = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    // my先手: floor(22*1.0*1.1)=24 → opponentHp=76
    // opponent後手: floor(22*1.0*0.9)=19 → myHp=81
    expect(result.opponentHpAfter).toBe(76)
    expect(result.myHpAfter).toBe(81)
  })

  it('先手補正: guest 側で spd が高ければ guest が先手になる', () => {
    // myRole=guest, mySpd=20 > opponentSpd=10 → myGoesFirst=true
    const my = makeCreature({ atk: 20, def: 10, spd: 20 })
    const opponent = makeCreature({ atk: 20, def: 10, spd: 10 })
    const result = resolveTurn(my, opponent, 'attack', 'attack', 'guest', 0, makeEffects())
    // guest 先手: my先手 → floor(22*1.1)=24 → opponentHp=76
    // opponent後手: floor(22*0.9)=19 → myHp=81
    expect(result.opponentHpAfter).toBe(76)
    expect(result.myHpAfter).toBe(81)
  })

  it('host が SPD 同値のとき host が先手になる (guest は後手)', () => {
    // myRole=host, mySpd=10 >= opponentSpd=10 → myGoesFirst=true
    const my = makeCreature({ spd: 10 })
    const opponent = makeCreature({ spd: 10 })
    const hostResult = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    // SPD同値: calcDamage では spd(10) > spd(10) → false → spdMod=0.9 (両者とも後手扱い)
    // host先手(my attacks): floor(22*0.9)=19 → opponentHp=81
    // opponent後手: floor(22*0.9)=19 → myHp=81
    expect(hostResult.opponentHpAfter).toBe(81)
    expect(hostResult.myHpAfter).toBe(81)

    // myRole=guest, mySpd=10, opponentSpd=10 → mySpd > opponentSpd? No → myGoesFirst=false → opponent先手
    const guestResult = resolveTurn(my, opponent, 'attack', 'attack', 'guest', 0, makeEffects())
    // opponent先手: floor(22*0.9)=19 → myHp=81
    // my後手: floor(22*0.9)=19 → opponentHp=81
    expect(guestResult.myHpAfter).toBe(81)
    expect(guestResult.opponentHpAfter).toBe(81)
  })

  it('結果の HP が 0 以下にならない (Math.max(0, ...) で保護)', () => {
    // 超高攻撃力で確実に HP を 0 以下にする
    const my = makeCreature({ atk: 1000, spd: 15 })
    const opponent = makeCreature({ hp: 1, maxHp: 100, spd: 10 })
    const result = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    expect(result.opponentHpAfter).toBeGreaterThanOrEqual(0)
    expect(result.myHpAfter).toBeGreaterThanOrEqual(0)
  })

  it('logMessages にアクション名や効果が含まれる', () => {
    const my = makeCreature({ name: 'マイモン', spd: 15 })
    const opponent = makeCreature({ name: 'エネモン', spd: 10 })
    const result = resolveTurn(my, opponent, 'attack', 'attack', 'host', 0, makeEffects())
    // 攻撃ログが含まれること
    expect(result.logMessages.some(msg => msg.includes('マイモン'))).toBe(true)
    expect(result.logMessages.some(msg => msg.includes('攻撃'))).toBe(true)
    expect(result.logMessages.some(msg => msg.includes('ダメージ'))).toBe(true)
  })

  it('guard アクションのとき ガードログが出力される', () => {
    const my = makeCreature({ name: 'マイモン', spd: 15 })
    const opponent = makeCreature({ name: 'エネモン', spd: 10 })
    const result = resolveTurn(my, opponent, 'guard', 'attack', 'host', 0, makeEffects())
    expect(result.logMessages.some(msg => msg.includes('ガード'))).toBe(true)
  })

  it('special (Thunder) の麻痺発生時: opponentParalyzed=true かつログに麻痺メッセージが入る', () => {
    // seed=42: rng1=0.252 < 0.5 → paralyzed=true
    const my = makeCreature({ type: 'Thunder', name: 'マイモン', spd: 15 })
    const opponent = makeCreature({ type: 'Fire', name: 'エネモン', spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 42, makeEffects())
    expect(result.opponentParalyzed).toBe(true)
    expect(result.logMessages.some(msg => msg.includes('麻痺'))).toBe(true)
  })

  it('special (Water) の自己回復: myHp が攻撃受けても回復分増加する', () => {
    // my Water special: selfHeal=floor(100*0.3)=30
    // opponent(Fire) attacks my(Water): typeMod Fire vs Water = 0.8, spdMod=0.9
    //   floor(22 * 0.8 * 0.9) = floor(15.84) = 15
    // myHp = 100 + 30 - 15 = 115
    const my = makeCreature({ type: 'Water', name: 'マイモン', spd: 15 })
    const opponent = makeCreature({ type: 'Fire', name: 'エネモン', spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 0, makeEffects())
    expect(result.myHpAfter).toBe(115)
    expect(result.logMessages.some(msg => msg.includes('回復'))).toBe(true)
  })

  it('special (Dark) の ATK デバフ: opponentAtkDebuff=true になる', () => {
    const my = makeCreature({ type: 'Dark', spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 0, makeEffects())
    expect(result.opponentAtkDebuff).toBe(true)
  })

  it('special (Light) の DEF バフ: myDefBuff > 0 になる', () => {
    const my = makeCreature({ type: 'Light', spd: 15 })
    const opponent = makeCreature({ spd: 10 })
    const result = resolveTurn(my, opponent, 'special', 'attack', 'host', 0, makeEffects())
    expect(result.myDefBuff).toBeGreaterThan(0)
    // defBuffTurns=2 が設定され、ターン終了で -1 → 1 になる
    expect(result.myDefBuff).toBe(1)
  })
})

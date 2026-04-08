import { useEffect, useRef, useState, useCallback } from 'react'
import type { CreatureSnapshot, BattleRole, BattleResult, BattleAction } from '../types/battle'
import { useBattleState } from '../hooks/useBattleState'
import { resolveTurn } from '../utils/battleLogic'
import { selectCpuAction } from '../utils/cpuBattle'
import BattleHPBar from './BattleHPBar'
import BattleActionButtons from './BattleActionButtons'
import BattleResultModal from './BattleResult'
import BattleCreatureDisplay from './BattleCreatureDisplay'
import type { BattleEffectType } from './BattleCreatureDisplay'

interface BattleScreenProps {
  myCreature: CreatureSnapshot
  opponentCreature: CreatureSnapshot
  role: BattleRole
  seed: number
  onBattleEnd: (result: BattleResult) => void
  battleMode: 'cpu' | 'qr'
}

const MAX_TURNS = 10

export default function BattleScreen({
  myCreature,
  opponentCreature,
  role,
  seed: initialSeed,
  onBattleEnd,
  battleMode,
}: BattleScreenProps) {
  const { state, processEvent, selectAction, addLog, updateHp, updateEffects } = useBattleState()

  const [localMyHp, setLocalMyHp] = useState(myCreature.hp)
  const [localOpponentHp, setLocalOpponentHp] = useState(opponentCreature.hp)
  const [showResult, setShowResult] = useState(false)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [actionButtonKey, setActionButtonKey] = useState(0)

  // エフェクト状態
  const [myEffect, setMyEffect] = useState<BattleEffectType>(null)
  const [opponentEffect, setOpponentEffect] = useState<BattleEffectType>(null)
  const [myDamageNumber, setMyDamageNumber] = useState<number | null>(null)
  const [opponentDamageNumber, setOpponentDamageNumber] = useState<number | null>(null)
  const [myPoisonActive, setMyPoisonActive] = useState(false)
  const [opponentPoisonActive, setOpponentPoisonActive] = useState(false)
  const [myIsParalyzed, setMyIsParalyzed] = useState(false)
  const [opponentIsParalyzed, setOpponentIsParalyzed] = useState(false)

  const effectsRef = useRef({
    myPoisonTurns: 0,
    opponentPoisonTurns: 0,
    myParalyzed: false,
    opponentParalyzed: false,
    myDefBuff: 0,
    opponentDefBuff: 0,
    specialCooldown: 0,
    opponentSpecialCooldown: 0,
  })

  const myCreatureRef = useRef<CreatureSnapshot>({ ...myCreature })
  const opponentCreatureRef = useRef<CreatureSnapshot>({ ...opponentCreature })
  const roleRef = useRef(role)

  // エフェクトをトリガーする共通関数
  const triggerEffects = useCallback((
    myAction: BattleAction,
    opponentAction: BattleAction,
    resolution: {
      myHpAfter: number
      opponentHpAfter: number
      myPoisonTurns: number
      opponentPoisonTurns: number
      myParalyzed: boolean
      opponentParalyzed: boolean
    },
    prevMyHp: number,
    prevOpponentHp: number,
  ) => {
    const opponentDmg = prevOpponentHp - resolution.opponentHpAfter
    const myDmg = prevMyHp - resolution.myHpAfter

    if (myAction === 'attack') {
      setOpponentEffect('hit')
      if (opponentAction === 'guard' && opponentDmg <= 0) {
        setOpponentEffect('guard')
        setOpponentDamageNumber(0)
      } else {
        setOpponentDamageNumber(opponentDmg > 0 ? opponentDmg : null)
      }
    } else if (myAction === 'special') {
      setOpponentEffect('special')
      if (opponentDmg > 0) {
        setTimeout(() => {
          setOpponentEffect('hit')
          setOpponentDamageNumber(opponentDmg)
        }, 300)
      }
      if (myCreatureRef.current.type === 'Water' && resolution.myHpAfter > prevMyHp) {
        setTimeout(() => {
          setMyEffect('heal')
          setMyDamageNumber(-(resolution.myHpAfter - prevMyHp + myDmg))
        }, 200)
      }
    } else if (myAction === 'guard') {
      setMyEffect('guard')
      if (myDmg <= 0) {
        setMyDamageNumber(0)
      }
    }

    if (opponentAction === 'attack') {
      setTimeout(() => {
        setMyEffect('hit')
        if (myAction !== 'guard' || myDmg > 0) {
          setMyDamageNumber(myDmg > 0 ? myDmg : null)
        }
      }, myAction === 'guard' ? 0 : 400)
    } else if (opponentAction === 'special') {
      setTimeout(() => {
        setMyEffect(myDmg > 0 ? 'hit' : 'special')
        if (myDmg > 0) setMyDamageNumber(myDmg)
      }, 400)
    }

    setMyPoisonActive(resolution.myPoisonTurns > 0)
    setOpponentPoisonActive(resolution.opponentPoisonTurns > 0)
    setMyIsParalyzed(resolution.myParalyzed)
    setOpponentIsParalyzed(resolution.opponentParalyzed)

    setTimeout(() => {
      setMyEffect(null)
      setOpponentEffect(null)
      setMyDamageNumber(null)
      setOpponentDamageNumber(null)
    }, 1200)
  }, [])

  // バトル初期化
  const battleInitialized = useRef(false)
  useEffect(() => {
    if (battleInitialized.current) return
    battleInitialized.current = true
    processEvent({ event: 'battle_start', seed: initialSeed, yourRole: role })
  }, [initialSeed, role, processEvent])

  // ローカルターン解決（CPU戦・QR戦共通）
  const cpuTurnRef = useRef(0)
  const resolveCpuTurn = useCallback((myAction: BattleAction) => {
    const cpuAction = selectCpuAction(effectsRef.current.opponentSpecialCooldown)
    const seed = initialSeed + cpuTurnRef.current * 1000 + Date.now() % 1000
    cpuTurnRef.current++

    const prevMyHp = myCreatureRef.current.hp
    const prevOpponentHp = opponentCreatureRef.current.hp

    const resolution = resolveTurn(
      myCreatureRef.current,
      opponentCreatureRef.current,
      myAction,
      cpuAction,
      roleRef.current,
      seed,
      effectsRef.current
    )

    triggerEffects(myAction, cpuAction, resolution, prevMyHp, prevOpponentHp)

    setLocalMyHp(resolution.myHpAfter)
    setLocalOpponentHp(resolution.opponentHpAfter)
    myCreatureRef.current = { ...myCreatureRef.current, hp: resolution.myHpAfter }
    opponentCreatureRef.current = { ...opponentCreatureRef.current, hp: resolution.opponentHpAfter }
    updateHp(resolution.myHpAfter, resolution.opponentHpAfter)

    effectsRef.current = {
      myPoisonTurns: resolution.myPoisonTurns,
      opponentPoisonTurns: resolution.opponentPoisonTurns,
      myParalyzed: resolution.myParalyzed,
      opponentParalyzed: resolution.opponentParalyzed,
      myDefBuff: resolution.myDefBuff,
      opponentDefBuff: resolution.opponentDefBuff,
      specialCooldown: myAction === 'special' ? 3 : Math.max(0, effectsRef.current.specialCooldown - 1),
      opponentSpecialCooldown: cpuAction === 'special' ? 3 : Math.max(0, effectsRef.current.opponentSpecialCooldown - 1),
    }
    updateEffects({
      myPoisonTurns: resolution.myPoisonTurns,
      opponentPoisonTurns: resolution.opponentPoisonTurns,
      myParalyzed: resolution.myParalyzed,
      myDefBuff: resolution.myDefBuff,
    })

    resolution.logMessages.forEach(msg => addLog(msg))
    setActionButtonKey(k => k + 1)

    const turnNumber = cpuTurnRef.current
    if (resolution.myHpAfter <= 0 || resolution.opponentHpAfter <= 0 || turnNumber >= MAX_TURNS) {
      let winner: 'me' | 'opponent' | 'draw'
      if (resolution.myHpAfter <= 0 && resolution.opponentHpAfter <= 0) {
        winner = 'draw'
      } else if (resolution.opponentHpAfter <= 0) {
        winner = 'me'
      } else if (resolution.myHpAfter <= 0) {
        winner = 'opponent'
      } else {
        winner = resolution.myHpAfter > resolution.opponentHpAfter ? 'me'
          : resolution.myHpAfter < resolution.opponentHpAfter ? 'opponent'
          : 'draw'
      }

      const result: BattleResult = {
        result: winner === 'me' ? 'win' : winner === 'opponent' ? 'lose' : 'draw',
        expGain: winner === 'me' ? 50 + (opponentCreature.level ?? 1) * 5 : winner === 'draw' ? 25 : 10,
        happinessChange: winner === 'me' ? 20 : winner === 'draw' ? 0 : -10,
        hpAfterBattle: resolution.myHpAfter,
      }
      setBattleResult(result)
      setTimeout(() => setShowResult(true), 800)
      return
    }

    processEvent({ event: 'turn_resolved', turnNumber: cpuTurnRef.current })
  }, [initialSeed, updateHp, updateEffects, addLog, opponentCreature.level, processEvent, triggerEffects])

  const handleSelectAction = (action: BattleAction) => {
    selectAction(action)
    setTimeout(() => resolveCpuTurn(action), 500)
  }

  const handleResultClose = () => {
    if (battleResult) {
      onBattleEnd(battleResult)
    }
  }

  const isSelecting = state.phase === 'selecting' && !showResult
  const recentLogs = state.battleLog.slice(-5)

  const modeLabel = battleMode === 'cpu' ? 'CPUバトル' : 'QRバトル'

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f1a2d 100%)', maxWidth: 420, margin: '0 auto' }}
    >
      {/* ヘッダー */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid #0f346044' }}>
        <div className="flex items-center gap-2">
          <div className="font-pixel" style={{ fontSize: '0.75rem', color: '#4fc3f7' }}>
            ⚔️ {modeLabel} ターン {state.currentTurn + 1}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state.myParalyzed && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.65rem', background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044' }}>
              ⚡麻痺
            </span>
          )}
          {effectsRef.current.myPoisonTurns > 0 && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.65rem', background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8044' }}>
              ☠毒{effectsRef.current.myPoisonTurns}T
            </span>
          )}
        </div>
      </div>

      {/* 対戦相手エリア */}
      <div className="mx-4 mt-2">
        <BattleHPBar
          label={opponentCreature.name}
          hp={localOpponentHp}
          maxHp={opponentCreature.maxHp}
          type={opponentCreature.type}
        />
      </div>

      {/* バトルフィールド */}
      <div
        className="mx-4 mt-2 relative flex items-center justify-between px-4"
        style={{
          minHeight: 160,
          background: 'radial-gradient(ellipse at center, #16213e44 0%, transparent 70%)',
          borderRadius: 12,
        }}
      >
        <div className="flex-1" />
        <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
          <BattleCreatureDisplay
            name={myCreature.name}
            type={myCreature.type}
            evolutionStage={myCreature.evolutionStage}
            isOpponent={false}
            effect={myEffect}
            damageNumber={myDamageNumber}
            poisonActive={myPoisonActive}
            paralyzed={myIsParalyzed}
            customSvg={myCreature.customSvg}
          />
        </div>

        <div
          className="font-pixel mx-2"
          style={{
            fontSize: '0.7rem',
            color: '#f43f5e',
            textShadow: '0 0 10px #f43f5e88',
            fontWeight: 'bold',
          }}
        >
          VS
        </div>

        <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
          <BattleCreatureDisplay
            name={opponentCreature.name}
            type={opponentCreature.type}
            evolutionStage={opponentCreature.evolutionStage}
            isOpponent={true}
            effect={opponentEffect}
            damageNumber={opponentDamageNumber}
            poisonActive={opponentPoisonActive}
            paralyzed={opponentIsParalyzed}
          />
        </div>
        <div className="flex-1" />
      </div>

      {/* バトルログ */}
      <div
        className="mx-4 mt-2 px-3 py-2 rounded-lg flex-1"
        style={{
          background: '#16213e',
          border: '1px solid #0f3460',
          minHeight: 80,
          maxHeight: 110,
          overflowY: 'auto',
        }}
      >
        {recentLogs.length === 0 ? (
          <div className="font-pixel text-center" style={{ fontSize: '0.65rem', color: '#64748b', paddingTop: 8 }}>
            バトル中...
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentLogs.map((log, i) => (
              <div
                key={i}
                className="font-pixel"
                style={{ fontSize: '0.65rem', color: i === recentLogs.length - 1 ? '#e0e0e0' : '#64748b' }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 自分のHP + アクション */}
      <div className="mx-4 mt-2 mb-4 flex flex-col gap-2">
        <BattleHPBar
          label={`${myCreature.name}（あなた）`}
          hp={localMyHp}
          maxHp={myCreature.maxHp}
          type={myCreature.type}
        />

        <div className="font-pixel text-center" style={{ fontSize: '0.65rem', color: '#64748b' }}>
          {isSelecting ? 'アクションを選んでください' : state.phase === 'resolving' ? '解決中...' : state.phase === 'finished' ? 'バトル終了' : '待機中...'}
        </div>

        <BattleActionButtons
          key={actionButtonKey}
          onSelect={handleSelectAction}
          disabled={!isSelecting || state.myAction !== null}
          specialCooldown={state.specialCooldown}
        />
      </div>

      {/* バトル結果モーダル */}
      {showResult && battleResult && (
        <BattleResultModal
          winner={battleResult.result === 'win' ? 'me' : battleResult.result === 'lose' ? 'opponent' : 'draw'}
          expGain={battleResult.expGain}
          happinessChange={battleResult.happinessChange}
          onClose={handleResultClose}
        />
      )}
    </div>
  )
}

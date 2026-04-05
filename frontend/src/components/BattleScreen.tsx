import { useEffect, useRef, useState, useCallback } from 'react'
import type { CreatureSnapshot, BattleRole, BattleResult, BattleAction } from '../types/battle'
import { useBattleWebSocket } from '../hooks/useBattleWebSocket'
import { useBattleState } from '../hooks/useBattleState'
import { resolveTurn } from '../utils/battleLogic'
import { selectCpuAction } from '../utils/cpuBattle'
import BattleHPBar from './BattleHPBar'
import BattleActionButtons from './BattleActionButtons'
import BattleResultModal from './BattleResult'

interface BattleScreenProps {
  myCreature: CreatureSnapshot
  opponentCreature: CreatureSnapshot
  role: BattleRole
  seed: number
  roomCode: string
  onBattleEnd: (result: BattleResult) => void
  isCpuBattle?: boolean
}

const MAX_TURNS = 10

export default function BattleScreen({
  myCreature,
  opponentCreature,
  role,
  seed: initialSeed,
  roomCode,
  onBattleEnd,
  isCpuBattle = false,
}: BattleScreenProps) {
  const ws = useBattleWebSocket()
  const { state, processEvent, selectAction, addLog, updateHp, updateEffects } = useBattleState()

  const [localMyHp, setLocalMyHp] = useState(myCreature.hp)
  const [localOpponentHp, setLocalOpponentHp] = useState(opponentCreature.hp)
  const [showResult, setShowResult] = useState(false)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [actionButtonKey, setActionButtonKey] = useState(0)

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
  const currentSeedRef = useRef(initialSeed)
  const roleRef = useRef(role)

  // CPU戦の初期化
  const cpuInitialized = useRef(false)
  useEffect(() => {
    if (isCpuBattle && !cpuInitialized.current) {
      cpuInitialized.current = true
      processEvent({ event: 'battle_start', seed: initialSeed, yourRole: role })
    }
  }, [isCpuBattle, initialSeed, role, processEvent])

  // WebSocket接続（オンライン戦のみ）
  useEffect(() => {
    if (isCpuBattle) return
    ws.connect(myCreature as unknown as Parameters<typeof ws.connect>[0]).catch(() => {
      // ignore
    })
    return () => {
      ws.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // イベント処理
  useEffect(() => {
    if (!ws.lastEvent) return
    processEvent(ws.lastEvent)

    const ev = ws.lastEvent

    if (ev.event === 'actions_locked') {
      const hostAction = ev.hostAction as BattleAction
      const guestAction = ev.guestAction as BattleAction
      const myAction = roleRef.current === 'host' ? hostAction : guestAction
      const opponentAction = roleRef.current === 'host' ? guestAction : hostAction

      currentSeedRef.current = ev.seed

      const resolution = resolveTurn(
        myCreatureRef.current,
        opponentCreatureRef.current,
        myAction,
        opponentAction,
        roleRef.current,
        ev.seed,
        effectsRef.current
      )

      // HP更新
      setLocalMyHp(resolution.myHpAfter)
      setLocalOpponentHp(resolution.opponentHpAfter)
      myCreatureRef.current = { ...myCreatureRef.current, hp: resolution.myHpAfter }
      opponentCreatureRef.current = { ...opponentCreatureRef.current, hp: resolution.opponentHpAfter }
      updateHp(resolution.myHpAfter, resolution.opponentHpAfter)

      // エフェクト更新
      effectsRef.current = {
        myPoisonTurns: resolution.myPoisonTurns,
        opponentPoisonTurns: resolution.opponentPoisonTurns,
        myParalyzed: resolution.myParalyzed,
        opponentParalyzed: resolution.opponentParalyzed,
        myDefBuff: resolution.myDefBuff,
        opponentDefBuff: resolution.opponentDefBuff,
        specialCooldown: myAction === 'special' ? 3 : Math.max(0, effectsRef.current.specialCooldown - 1),
        opponentSpecialCooldown: opponentAction === 'special' ? 3 : Math.max(0, effectsRef.current.opponentSpecialCooldown - 1),
      }
      updateEffects({
        myPoisonTurns: resolution.myPoisonTurns,
        opponentPoisonTurns: resolution.opponentPoisonTurns,
        myParalyzed: resolution.myParalyzed,
        myDefBuff: resolution.myDefBuff,
      })

      // ログ追加
      resolution.logMessages.forEach(msg => addLog(msg))

      // アクションボタンリセット（次ターン用）
      setActionButtonKey(k => k + 1)
    }

    if (ev.event === 'battle_end') {
      const myWins = ev.winner === 'draw' ? false : (ev.winner === 'host') === (role === 'host')
      const isDraw = ev.winner === 'draw'
      const result: BattleResult = {
        result: isDraw ? 'draw' : myWins ? 'win' : 'lose',
        expGain: myWins ? 50 + (opponentCreature.level ?? 1) * 5 : isDraw ? 25 : 10,
        happinessChange: myWins ? 20 : isDraw ? 0 : -10,
        hpAfterBattle: localMyHp,
      }
      setBattleResult(result)
      setShowResult(true)
    }
  }, [ws.lastEvent, processEvent, addLog, updateHp, updateEffects, role, opponentCreature.level, localMyHp])

  // CPU戦: プレイヤーのアクション選択後にCPUアクションを決定してターン解決
  const cpuTurnRef = useRef(0)
  const resolveCpuTurn = useCallback((myAction: BattleAction) => {
    const cpuAction = selectCpuAction(effectsRef.current.opponentSpecialCooldown)
    const seed = initialSeed + cpuTurnRef.current * 1000 + Date.now() % 1000
    cpuTurnRef.current++

    const resolution = resolveTurn(
      myCreatureRef.current,
      opponentCreatureRef.current,
      myAction,
      cpuAction,
      roleRef.current,
      seed,
      effectsRef.current
    )

    // HP更新
    setLocalMyHp(resolution.myHpAfter)
    setLocalOpponentHp(resolution.opponentHpAfter)
    myCreatureRef.current = { ...myCreatureRef.current, hp: resolution.myHpAfter }
    opponentCreatureRef.current = { ...opponentCreatureRef.current, hp: resolution.opponentHpAfter }
    updateHp(resolution.myHpAfter, resolution.opponentHpAfter)

    // エフェクト更新
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

    // ログ追加
    resolution.logMessages.forEach(msg => addLog(msg))

    // アクションボタンリセット
    setActionButtonKey(k => k + 1)

    // バトル終了判定
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
        // 最大ターン到達: HP残量比較
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

    // 次のターンへ: turn_resolvedイベントでアクションをクリアしフェーズをselectingに戻す
    processEvent({ event: 'turn_resolved', turnNumber: cpuTurnRef.current })
  }, [initialSeed, updateHp, updateEffects, addLog, opponentCreature.level, processEvent])

  const handleSelectAction = (action: BattleAction) => {
    selectAction(action)
    if (isCpuBattle) {
      // CPU戦: 少し遅延させてターン解決（演出用）
      setTimeout(() => resolveCpuTurn(action), 500)
    } else {
      ws.sendAction(roomCode, action)
    }
  }

  const handleResultClose = () => {
    if (battleResult) {
      onBattleEnd(battleResult)
    }
  }

  const isSelecting = isCpuBattle ? (state.phase === 'selecting' && !showResult) : state.phase === 'selecting'
  const recentLogs = state.battleLog.slice(-5)

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f1a2d 100%)', maxWidth: 420, margin: '0 auto' }}
    >
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid #0f346044' }}>
        <div className="font-pixel" style={{ fontSize: '0.55rem', color: '#4fc3f7' }}>
          ⚔️ {isCpuBattle ? 'CPUバトル' : 'バトル'} ターン {state.currentTurn + 1}
        </div>
        <div className="flex items-center gap-2">
          {state.myParalyzed && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.4rem', background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044' }}>
              ⚡麻痺
            </span>
          )}
          {effectsRef.current.myPoisonTurns > 0 && (
            <span className="font-pixel px-2 py-0.5 rounded-full"
              style={{ fontSize: '0.4rem', background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8044' }}>
              ☠毒{effectsRef.current.myPoisonTurns}T
            </span>
          )}
        </div>
      </div>

      {/* 相手HPバー */}
      <div className="mx-4 mt-3">
        <BattleHPBar
          label={opponentCreature.name}
          hp={localOpponentHp}
          maxHp={opponentCreature.maxHp}
          type={opponentCreature.type}
        />
      </div>

      {/* バトルログ */}
      <div
        className="mx-4 mt-3 px-3 py-2 rounded-lg flex-1"
        style={{
          background: '#16213e',
          border: '1px solid #0f3460',
          minHeight: 120,
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {recentLogs.length === 0 ? (
          <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b', paddingTop: 8 }}>
            バトル中...
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentLogs.map((log, i) => (
              <div
                key={i}
                className="font-pixel"
                style={{ fontSize: '0.45rem', color: i === recentLogs.length - 1 ? '#e0e0e0' : '#64748b' }}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 自分のHP + アクション */}
      <div className="mx-4 mt-3 mb-6 flex flex-col gap-3">
        <BattleHPBar
          label={`${myCreature.name}（あなた）`}
          hp={localMyHp}
          maxHp={myCreature.maxHp}
          type={myCreature.type}
        />

        {/* フェーズ表示 */}
        <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b' }}>
          {isSelecting ? 'アクションを選んでください' : state.phase === 'resolving' ? '解決中...' : state.phase === 'finished' ? 'バトル終了' : '待機中...'}
        </div>

        {/* アクションボタン */}
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

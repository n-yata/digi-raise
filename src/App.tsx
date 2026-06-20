import { useEffect, useState, useCallback, useRef } from 'react'
import type { Creature, GameScreen, EvolutionStage, CreatureId } from './types/creature'
import type { BattleRole, CreatureSnapshot, BattleResult } from './types/battle'
import { applyTimeUpdate } from './utils/gameLogic'
import { canEvolve, evolveCreature } from './utils/evolution'
import { saveSaveData, loadSaveData, deleteSaveData, migrateLegacyData } from './utils/storage'
import type { SaveData } from './utils/storage'
import { useAuth } from './hooks/useAuth'
import { useCloudSave } from './hooks/useCloudSave'
import TitleScreen from './components/TitleScreen'
import CreatureSetup from './components/CreatureSetup'
import MainGame from './components/MainGame'
import EvolutionScreen from './components/EvolutionScreen'
import DeathScreen from './components/DeathScreen'
import StatusScreen from './components/StatusScreen'
import ZukanScreen from './components/ZukanScreen'
import BattleLobbyScreen from './components/BattleLobbyScreen'
import BattleScreen from './components/BattleScreen'
import { feedCreature, trainCreature, playWithCreature, toggleLights } from './utils/gameLogic'
import type { ActionAnim } from './utils/gameLogic'
import { playSound } from './utils/sound'
import { FOOD_SPRITES } from './components/items/foodSprites'
import { TOY_SPRITES } from './components/items/toySprites'
import type { ActionItem } from './types/action'

/** ごはん/遊びのアクション演出（eating/happy）を再生する時間（ms）。
 *  食べる/遊ぶ動作（アイテムが口元へ運ばれてかじられる・道具で遊ぶ）を見せきる長さ。
 *  CSS 側のアイテムアニメーション（foodEat / toy*）と尺を合わせる。 */
const ACTION_ANIM_MS = 1600
/** 卵をメイン画面に見せてから、ふ化演出を始めるまでの待ち時間（ms）。 */
const EGG_HATCH_DELAY_MS = 3000
/** ふ化演出（殻が割れる振動＋閃光）の長さ（ms）。これを過ぎたらクリーチャーへ切り替える。 */
const EGG_HATCH_ANIM_MS = 700

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title')
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [activeCreatureId, setActiveCreatureId] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [actionAnimation, setActionAnimation] = useState<ActionAnim | null>(null)
  // 食事・遊び演出中に表示するアイテム（食べ物 / 遊び道具）。演出終了で null に戻す。
  const [actionItem, setActionItem] = useState<ActionItem | null>(null)
  const [showTrainingGame, setShowTrainingGame] = useState(false)
  const [pendingEvolution, setPendingEvolution] = useState(false)
  const [hatching, setHatching] = useState(false)
  const [evolvedFrom, setEvolvedFrom] = useState<EvolutionStage | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [hasExistingSave, setHasExistingSave] = useState(false)
  const [loading, setLoading] = useState(true)
  const [discoveredCreatures, setDiscoveredCreatures] = useState<Set<CreatureId>>(new Set())
  const [zukanReturnScreen, setZukanReturnScreen] = useState<GameScreen>('title')
  // 未認証で「つづきから」を押した後、サインイン→クラウド復元の完了を待って自動遷移するためのフラグ
  const [continuePending, setContinuePending] = useState(false)

  // Battle state
  const [battleRole, setBattleRole] = useState<BattleRole | null>(null)
  const [battleOpponent, setBattleOpponent] = useState<CreatureSnapshot | null>(null)
  const [battleSeed, setBattleSeed] = useState<number>(0)
  const [battleMode, setBattleMode] = useState<'cpu' | 'qr'>('cpu')
  const creatureRef = useRef<Creature | null>(null)
  const devModeRef = useRef(devMode)
  const activeCreatureIdRef = useRef<string | null>(null)
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const discoveredRef = useRef<Set<CreatureId>>(new Set())
  // useAuth が後で定義されるため ref 経由で間接参照する
  const signInRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const authStatusRef = useRef<string>('loading')

  // Derive active creature
  const activeCreature = creatures.find(c => c.id === activeCreatureId) ?? null

  // Keep refs in sync
  useEffect(() => { creatureRef.current = activeCreature }, [activeCreature])
  useEffect(() => { devModeRef.current = devMode }, [devMode])
  useEffect(() => { activeCreatureIdRef.current = activeCreatureId }, [activeCreatureId])
  useEffect(() => { discoveredRef.current = discoveredCreatures }, [discoveredCreatures])

  // Load save on mount
  useEffect(() => {
    migrateLegacyData().then(() => loadSaveData()).then(saved => {
      if (saved && saved.creatures.length > 0 && saved.creatures.some(c => c.isAlive)) {
        setHasExistingSave(true)
      }
      if (saved?.discoveredCreatures) {
        setDiscoveredCreatures(new Set(saved.discoveredCreatures))
      }
      setLoading(false)
    })
  }, [])

  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }, [])

  // メイン画面で一時的にアクション演出（eating/happy/attack）を再生し、一定時間後に自動解除する。
  // 連打されても前のタイマーを破棄して多重発火を防ぐ。
  // item を渡すと演出中に食べ物 / 遊び道具のドット絵を併せて表示する。
  const triggerAction = useCallback((kind: ActionAnim, item: ActionItem | null = null) => {
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
    setActionAnimation(kind)
    setActionItem(item)
    actionTimerRef.current = setTimeout(() => {
      setActionAnimation(null)
      setActionItem(null)
      actionTimerRef.current = null
    }, ACTION_ANIM_MS)
  }, [])

  // 食事・遊び演出を即終了する（画面タップによるスキップ）。
  const skipAction = useCallback(() => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current)
      actionTimerRef.current = null
    }
    setActionAnimation(null)
    setActionItem(null)
  }, [])

  // unmount 時にアクションタイマーを確実に解除（リーク防止）
  useEffect(() => () => { if (actionTimerRef.current) clearTimeout(actionTimerRef.current) }, [])

  const persistActiveCreature = useCallback((updated: Creature) => {
    setCreatures(prev => {
      const newCreatures = prev.map(c => c.id === updated.id ? updated : c)
      saveSaveData({ creatures: newCreatures, activeCreatureId: activeCreatureIdRef.current, discoveredCreatures: Array.from(discoveredRef.current) })
      return newCreatures
    })
  }, [])

  // Time tick
  useEffect(() => {
    if (screen !== 'main') return

    const tickInterval = devModeRef.current ? 5000 : 30000

    const tick = () => {
      const current = creatureRef.current
      if (!current || !current.isAlive) return

      const updated = applyTimeUpdate(current, devModeRef.current)
      persistActiveCreature(updated)

      if (!updated.isAlive) {
        setScreen('death')
        return
      }

      if (canEvolve(updated) && updated.evolutionStage > 0) {
        setPendingEvolution(true)
      }
    }

    const id = setInterval(tick, tickInterval)
    return () => clearInterval(id)
  }, [screen, persistActiveCreature])

  // Re-evaluate tick interval when devMode changes
  useEffect(() => {
    devModeRef.current = devMode
  }, [devMode])

  // Check evolution on activeCreature change
  useEffect(() => {
    if (!activeCreature || screen !== 'main') return
    if (!canEvolve(activeCreature)) {
      setPendingEvolution(false)
      return
    }

    if (activeCreature.evolutionStage === 0) {
      // 卵: メイン画面に数秒見せてから、その場でふ化演出を開始（画面遷移なし・タップ不要）
      const timer = setTimeout(() => {
        const c = creatureRef.current
        if (!c || c.evolutionStage !== 0 || !canEvolve(c)) return
        setHatching(true)
      }, EGG_HATCH_DELAY_MS)
      return () => clearTimeout(timer)
    }

    setPendingEvolution(true)
  }, [activeCreature, screen])

  // 卵のふ化演出が終わったら、メイン画面のままクリーチャーへ切り替える
  useEffect(() => {
    if (!hatching) return
    // 演出中に画面遷移したら中断（タイマーは張らない）
    if (screen !== 'main') {
      setHatching(false)
      return
    }
    const timer = setTimeout(() => {
      const c = creatureRef.current
      if (!c || c.evolutionStage !== 0) {
        setHatching(false)
        return
      }
      const hatched = evolveCreature(c)
      setDiscoveredCreatures(prev => {
        const next = new Set(prev)
        next.add(hatched.creatureId)
        discoveredRef.current = next
        return next
      })
      persistActiveCreature(hatched)
      setHatching(false)
      setPendingEvolution(false)
      playSound('hatch')
      showMessage(`${hatched.name} が うまれた！`)
    }, EGG_HATCH_ANIM_MS)
    return () => clearTimeout(timer)
  }, [hatching, screen, persistActiveCreature, showMessage])

  // --- Actions ---

  const handleNewGame = useCallback(() => {
    setScreen('setup')
    setPendingEvolution(false)
    setEvolvedFrom(null)
  }, [])

  const handleContinue = useCallback(async () => {
    // 認証状態が確定するまで（loading / signingIn 中）は何もしない。
    // signingIn 中の二重押下による多重サインインも防ぐ。
    const st = authStatusRef.current
    if (st === 'loading' || st === 'signingIn') return
    // 未認証なら先にサインインを促す。サインイン後、クラウド復元の完了を
    // 待ってから自動遷移する（continuePending を監視する useEffect が担当）。
    if (st === 'signedOut' || st === 'error') {
      setContinuePending(true)
      signInRef.current()
      return
    }
    // クラウド同期でメモリに読み込み済みの場合はそちらを優先する
    const aliveInMemory = creatures.filter(c => c.isAlive)
    if (aliveInMemory.length > 0) {
      const target = creatures.find(c => c.id === activeCreatureId && c.isAlive) ?? aliveInMemory[0]
      const updated = applyTimeUpdate(target, false)
      const newCreatures = creatures.map(c => c.id === updated.id ? updated : c)
      setCreatures(newCreatures)
      setActiveCreatureId(updated.id)
      saveSaveData({ creatures: newCreatures, activeCreatureId: updated.id, discoveredCreatures: Array.from(discoveredRef.current) })
      setScreen(updated.isAlive ? 'main' : 'death')
      return
    }
    // メモリにない場合はIndexedDBから読み込む
    const saved = await loadSaveData()
    if (!saved || saved.creatures.length === 0) return
    setCreatures(saved.creatures)
    if (saved.discoveredCreatures) setDiscoveredCreatures(new Set(saved.discoveredCreatures))
    const activeId = saved.activeCreatureId
    const activeCandidate = saved.creatures.find(c => c.id === activeId)
    const target = (activeCandidate && activeCandidate.isAlive)
      ? activeCandidate
      : saved.creatures.find(c => c.isAlive)
    if (!target) return // 全員死亡（起こらないはず）
    const updated = applyTimeUpdate(target, false)
    const newCreatures = saved.creatures.map(c => c.id === updated.id ? updated : c)
    setCreatures(newCreatures)
    setActiveCreatureId(updated.id)
    saveSaveData({ creatures: newCreatures, activeCreatureId: updated.id, discoveredCreatures: saved.discoveredCreatures ?? [] })
    if (!updated.isAlive) {
      setScreen('death')
    } else {
      setScreen('main')
    }
  }, [creatures, activeCreatureId])

  const handleStartGame = useCallback((newCreature: Creature) => {
    setDiscoveredCreatures(prev => {
      const next = new Set(prev)
      next.add('egg')
      discoveredRef.current = next
      return next
    })
    setCreatures(prev => {
      const newCreatures = [...prev, newCreature]
      saveSaveData({ creatures: newCreatures, activeCreatureId: newCreature.id, discoveredCreatures: Array.from(discoveredRef.current) })
      return newCreatures
    })
    setActiveCreatureId(newCreature.id)
    setScreen('main')
    setPendingEvolution(false)
  }, [])

  // ごはん: メイン画面のまま即時に満腹度を回復（満腹なら不可）。食べる動作を演出。
  const handleFeed = useCallback(() => {
    const c = creatureRef.current
    if (!c) return
    if (c.hunger >= 100) {
      showMessage('お腹いっぱいで食べられない！')
      return
    }
    const updated = feedCreature(c)
    persistActiveCreature(updated)
    const foodIndex = Math.floor(Math.random() * FOOD_SPRITES.length)
    triggerAction('eating', { kind: 'food', index: foodIndex })
    playSound('feed')
    showMessage('もぐもぐ！ご飯を食べた！')
  }, [persistActiveCreature, showMessage, triggerAction])

  // トレーニング: 連打ミニゲームを開く（就寝中は不可）
  const handleTrain = useCallback(() => {
    const c = creatureRef.current
    if (!c || c.isSleeping) return
    setShowTrainingGame(true)
  }, [])

  // トレーニングミニゲームの結果を適用（タップ数に比例して経験値を獲得）
  const handleTrainResult = useCallback((taps: number) => {
    const c = creatureRef.current
    if (c) {
      persistActiveCreature(trainCreature(c, taps))
      playSound(taps > 0 ? 'trainSuccess' : 'trainFail')
      showMessage(
        taps > 0
          ? `トレーニング完了！ ${taps} 連打で +${taps * 2} EXP！`
          : 'トレーニング失敗…でも経験になった'
      )
    }
    setShowTrainingGame(false)
  }, [persistActiveCreature, showMessage])

  // 遊び: メイン画面のまま即時に幸福度を回復（常に成功扱い）。喜ぶ動作を演出。
  const handlePlay = useCallback(() => {
    const c = creatureRef.current
    if (!c || c.isSleeping) return
    const updated = playWithCreature(c, true)
    persistActiveCreature(updated)
    const toyIndex = Math.floor(Math.random() * TOY_SPRITES.length)
    triggerAction('happy', { kind: 'toy', index: toyIndex })
    playSound('play')
    showMessage('一緒に遊んだ！楽しかった！')
  }, [persistActiveCreature, showMessage, triggerAction])

  const handleToggleLights = useCallback(() => {
    if (!creatureRef.current) return
    const updated = toggleLights(creatureRef.current)
    persistActiveCreature(updated)
    const lit = updated.lightsOn ?? true
    playSound(lit ? 'wake' : 'sleep')
    showMessage(lit ? '電気をつけた！' : '電気を消した…')
  }, [persistActiveCreature, showMessage])

  const handleEvolve = useCallback(() => {
    if (!creatureRef.current) return
    const prevStage = creatureRef.current.evolutionStage
    const evolved = evolveCreature(creatureRef.current)
    setDiscoveredCreatures(prev => {
      const next = new Set(prev)
      next.add(evolved.creatureId)
      discoveredRef.current = next
      return next
    })
    setEvolvedFrom(prevStage)
    persistActiveCreature(evolved)
    setPendingEvolution(false)
    playSound('evolve')
    setScreen('evolution')
  }, [persistActiveCreature])

  const handleEvolutionContinue = useCallback(() => {
    setScreen('main')
    setEvolvedFrom(null)
  }, [])

  const handleBattle = useCallback(() => {
    setScreen('battle_lobby')
  }, [])

  const handleCpuBattleStart = useCallback((opponentCreature: CreatureSnapshot, seed: number) => {
    setBattleRole('host')
    setBattleOpponent(opponentCreature)
    setBattleSeed(seed)
    setBattleMode('cpu')
    playSound('battleStart')
    setScreen('battle')
  }, [])

  const handleQrBattleStart = useCallback((opponentCreature: CreatureSnapshot, seed: number) => {
    setBattleRole('host')
    setBattleOpponent(opponentCreature)
    setBattleSeed(seed)
    setBattleMode('qr')
    playSound('battleStart')
    setScreen('battle')
  }, [])

  const handleBattleEnd = useCallback((result: BattleResult) => {
    if (!creatureRef.current) return
    const c = creatureRef.current
    const updated: Creature = {
      ...c,
      exp: c.exp + result.expGain,
      happiness: Math.max(0, Math.min(100, c.happiness + result.happinessChange)),
      hp: Math.max(1, result.hpAfterBattle),
      wins: result.result === 'win' ? (c.wins ?? 0) + 1 : (c.wins ?? 0),
      losses: result.result === 'lose' ? (c.losses ?? 0) + 1 : (c.losses ?? 0),
    }
    persistActiveCreature(updated)
    playSound(result.result === 'win' ? 'win' : result.result === 'lose' ? 'lose' : 'tap')
    setScreen('main')
    showMessage(result.result === 'win' ? '勝利！強さを証明した！' : result.result === 'lose' ? '敗北...次は勝つぞ！' : '引き分け...いい戦いだった')
  }, [persistActiveCreature, showMessage])

  const handleGoToCreatureListAfterDeath = useCallback(() => {
    // 生存中の最初のクリーチャーをアクティブにする
    const alive = creatures.find(c => c.isAlive && c.id !== activeCreatureId)
    if (!alive) {
      setScreen('setup')
      return
    }
    const resetTarget = { ...alive, lastUpdated: Date.now() }
    setCreatures(prev => {
      const newCreatures = prev.map(c => c.id === alive.id ? resetTarget : c)
      saveSaveData({ creatures: newCreatures, activeCreatureId: alive.id, discoveredCreatures: Array.from(discoveredRef.current) })
      return newCreatures
    })
    setActiveCreatureId(alive.id)
    setScreen('status')
  }, [creatures, activeCreatureId])

  const handleStartOver = useCallback(async () => {
    await deleteSaveData()
    setCreatures([])
    setActiveCreatureId(null)
    setScreen('title')
    setPendingEvolution(false)
    setEvolvedFrom(null)
    setHasExistingSave(false)
  }, [])

  const handleDeleteCreature = useCallback((id: string) => {
    if (id === activeCreatureId) return
    const target = creatures.find(c => c.id === id)
    if (!target) return
    const label = target.isAlive ? target.name : `${target.name}（墓石）`
    if (!window.confirm(`${label} を削除しますか？この操作は取り消せません。`)) return
    setCreatures(prev => {
      const newCreatures = prev.filter(c => c.id !== id)
      saveSaveData({ creatures: newCreatures, activeCreatureId: activeCreatureId!, discoveredCreatures: Array.from(discoveredRef.current) })
      return newCreatures
    })
  }, [creatures, activeCreatureId])

  const handleSelectCreature = useCallback((id: string) => {
    const target = creatures.find(c => c.id === id)
    if (!target || !target.isAlive) return
    const resetTarget = { ...target, lastUpdated: Date.now() }
    setCreatures(prev => {
      const newCreatures = prev.map(c => c.id === id ? resetTarget : c)
      saveSaveData({ creatures: newCreatures, activeCreatureId: id, discoveredCreatures: Array.from(discoveredRef.current) })
      return newCreatures
    })
    setActiveCreatureId(id)
    setScreen('main')
  }, [creatures])

  const handleCloudData = useCallback((loaded: SaveData) => {
    setCreatures(loaded.creatures)
    const active = loaded.creatures.find(c => c.id === loaded.activeCreatureId) ?? loaded.creatures.find(c => c.isAlive)
    if (active) setActiveCreatureId(active.id)
    setHasExistingSave(loaded.creatures.some(c => c.isAlive))
    if (loaded.discoveredCreatures) {
      setDiscoveredCreatures(new Set(loaded.discoveredCreatures))
    }
  }, [])

  const { authState, signIn, signOut } = useAuth()

  // ref を最新値に同期（handleContinue の useCallback 依存を増やさないため）
  useEffect(() => { signInRef.current = signIn }, [signIn])
  useEffect(() => { authStatusRef.current = authState.status }, [authState.status])

  // サインインがキャンセル/失敗で未認証へ戻ったら保留フラグを解除する
  // （フラグ残存による意図しない自動遷移・トースト残留を防ぐ）。
  useEffect(() => {
    if (continuePending && (authState.status === 'signedOut' || authState.status === 'error')) {
      setContinuePending(false)
    }
  }, [continuePending, authState.status])

  // 「つづきから」→サインイン後の自動遷移。
  // クラウド復元（useCloudSave→handleCloudData）で creatures が揃ったら main へ。
  // 一定時間データが来なければ、セーブが存在しないものとして通知する。
  useEffect(() => {
    if (!continuePending || authState.status !== 'signedIn') return

    const alive = creatures.filter(c => c.isAlive)
    if (alive.length > 0) {
      setContinuePending(false)
      const target = creatures.find(c => c.id === activeCreatureId && c.isAlive) ?? alive[0]
      const updated = applyTimeUpdate(target, false)
      const newCreatures = creatures.map(c => c.id === updated.id ? updated : c)
      setCreatures(newCreatures)
      setActiveCreatureId(updated.id)
      saveSaveData({ creatures: newCreatures, activeCreatureId: updated.id, discoveredCreatures: Array.from(discoveredRef.current) })
      setScreen('main')
      return
    }

    // データ到着待ち。一定時間で諦めて通知（クラウドにもセーブが無いケース）。
    const timer = setTimeout(() => {
      setContinuePending(false)
      showMessage('セーブデータが見つかりませんでした')
    }, 6000)
    return () => clearTimeout(timer)
  }, [continuePending, authState.status, creatures, activeCreatureId, showMessage])

  const uid = authState.status === 'signedIn' ? authState.uid : null
  const currentSaveData: SaveData | null = creatures.length > 0
    ? { creatures, activeCreatureId, discoveredCreatures: Array.from(discoveredCreatures) }
    : null
  const { syncStatus, lastSyncedAt } = useCloudSave({ uid, saveData: currentSaveData, onCloudData: handleCloudData })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center scanlines"
        style={{ background: '#1a1a2e' }}>
        <div className="text-center">
          <div className="mb-4 animate-float mx-auto" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
          <div className="font-pixel" style={{ fontSize: '0.75rem', color: '#4fc3f7' }}>
            ロード中...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a2e' }}>
      {screen === 'title' && (continuePending || message) && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center z-50"
          style={{ pointerEvents: 'none', paddingTop: 16 }}
        >
          <div
            className="font-pixel px-4 py-2 rounded-lg"
            style={{ fontSize: '0.7rem', background: '#16213e', border: '1px solid #4fc3f766', color: '#4fc3f7' }}
          >
            {continuePending ? 'セーブデータを確認中...' : message}
          </div>
        </div>
      )}
      {screen === 'title' && (
        <TitleScreen
          hasExistingSave={hasExistingSave || authState.status === 'signedOut' || authState.status === 'error'}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onZukan={() => { setZukanReturnScreen('title'); setScreen('zukan') }}
        />
      )}

      {screen === 'setup' && (
        <CreatureSetup
          onStart={handleStartGame}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'main' && activeCreature && (
        <MainGame
          creature={activeCreature}
          devMode={devMode}
          actionAnimation={actionAnimation}
          actionItem={actionItem}
          onSkipAction={skipAction}
          trainingActive={showTrainingGame}
          onTrainResult={handleTrainResult}
          message={message}
          pendingEvolution={pendingEvolution}
          hatching={hatching}
          onFeed={handleFeed}
          onTrain={handleTrain}
          onPlay={handlePlay}
          onToggleLights={handleToggleLights}
          onEvolve={handleEvolve}
          onStatus={() => setScreen('status')}
          onToggleDevMode={() => setDevMode(d => !d)}
          onBattle={handleBattle}
        />
      )}

      {screen === 'evolution' && activeCreature && (
        <EvolutionScreen
          creature={activeCreature}
          evolvedFrom={evolvedFrom}
          onContinue={handleEvolutionContinue}
        />
      )}

      {screen === 'death' && activeCreature && (
        <DeathScreen
          creature={activeCreature}
          hasOtherAliveCreatures={creatures.some(c => c.id !== activeCreature.id && c.isAlive)}
          onStartOver={handleStartOver}
          onGoToCreatureList={handleGoToCreatureListAfterDeath}
        />
      )}

      {screen === 'status' && activeCreature && (
        <StatusScreen
          creature={activeCreature}
          allCreatures={creatures}
          activeCreatureId={activeCreatureId!}
          onBack={() => setScreen('main')}
          onSelectCreature={handleSelectCreature}
          onDeleteCreature={handleDeleteCreature}
          onNewCreature={() => setScreen('setup')}
          onZukan={() => { setZukanReturnScreen('status'); setScreen('zukan') }}
          devMode={devMode}
          authState={authState}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          onSignIn={signIn}
          onSignOut={signOut}
        />
      )}

      {screen === 'zukan' && (
        <ZukanScreen
          discoveredCreatures={discoveredCreatures}
          devMode={devMode}
          onBack={() => setScreen(zukanReturnScreen)}
        />
      )}

      {screen === 'battle_lobby' && activeCreature && (
        <BattleLobbyScreen
          creature={activeCreature}
          onCpuBattleStart={handleCpuBattleStart}
          onQrBattleStart={handleQrBattleStart}
          onCancel={() => setScreen('main')}
        />
      )}

      {screen === 'battle' && activeCreature && battleRole && battleOpponent && (
        <BattleScreen
          myCreature={{
            name: activeCreature.name,
            evolutionStage: activeCreature.evolutionStage,
            type: activeCreature.creatureId,
            hp: activeCreature.hp,
            maxHp: activeCreature.maxHp,
            atk: activeCreature.atk,
            def: activeCreature.def,
            spd: activeCreature.spd,
            level: activeCreature.level,
          }}
          opponentCreature={battleOpponent}
          role={battleRole}
          seed={battleSeed}
          onBattleEnd={handleBattleEnd}
          battleMode={battleMode}
        />
      )}

    </div>
  )
}

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Creature, GameScreen, EvolutionStage } from './types/creature'
import type { BattleRole, CreatureSnapshot, BattleResult } from './types/battle'
import { applyTimeUpdate } from './utils/gameLogic'
import { canEvolve, evolveCreature } from './utils/evolution'
import { saveSaveData, loadSaveData, deleteSaveData, migrateLegacyData } from './utils/storage'
import type { SaveData } from './utils/storage'
import TitleScreen from './components/TitleScreen'
import CreatureSetup from './components/CreatureSetup'
import MainGame from './components/MainGame'
import EvolutionScreen from './components/EvolutionScreen'
import DeathScreen from './components/DeathScreen'
import StatusScreen from './components/StatusScreen'
import TrainingMiniGame from './components/TrainingMiniGame'
import PlayMiniGame from './components/PlayMiniGame'
import FeedMiniGame from './components/FeedMiniGame'
import BattleLobbyScreen from './components/BattleLobbyScreen'
import BattleScreen from './components/BattleScreen'
import { feedCreature, trainCreature, playWithCreature, toggleSleep } from './utils/gameLogic'

/** 卵をメイン画面に見せてから、ふ化演出を始めるまでの待ち時間（ms）。 */
const EGG_HATCH_DELAY_MS = 3000
/** ふ化演出（殻が割れる振動＋閃光）の長さ（ms）。これを過ぎたらクリーチャーへ切り替える。 */
const EGG_HATCH_ANIM_MS = 700

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title')
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [activeCreatureId, setActiveCreatureId] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [attackAnimation, setAttackAnimation] = useState(false)
  const [pendingEvolution, setPendingEvolution] = useState(false)
  const [hatching, setHatching] = useState(false)
  const [evolvedFrom, setEvolvedFrom] = useState<EvolutionStage | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [hasExistingSave, setHasExistingSave] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showTrainingGame, setShowTrainingGame] = useState(false)
  const [showPlayGame, setShowPlayGame] = useState(false)
  const [showFeedGame, setShowFeedGame] = useState(false)

  // Battle state
  const [battleRole, setBattleRole] = useState<BattleRole | null>(null)
  const [battleOpponent, setBattleOpponent] = useState<CreatureSnapshot | null>(null)
  const [battleSeed, setBattleSeed] = useState<number>(0)
  const [battleMode, setBattleMode] = useState<'cpu' | 'qr'>('cpu')
  const creatureRef = useRef<Creature | null>(null)
  const devModeRef = useRef(devMode)
  const activeCreatureIdRef = useRef<string | null>(null)

  // Derive active creature
  const activeCreature = creatures.find(c => c.id === activeCreatureId) ?? null

  // Keep refs in sync
  useEffect(() => { creatureRef.current = activeCreature }, [activeCreature])
  useEffect(() => { devModeRef.current = devMode }, [devMode])
  useEffect(() => { activeCreatureIdRef.current = activeCreatureId }, [activeCreatureId])

  // Load save on mount
  useEffect(() => {
    migrateLegacyData().then(() => loadSaveData()).then(saved => {
      if (saved && saved.creatures.length > 0 && saved.creatures.some(c => c.isAlive)) {
        setHasExistingSave(true)
      }
      setLoading(false)
    })
  }, [])

  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }, [])

  const persistActiveCreature = useCallback((updated: Creature) => {
    setCreatures(prev => {
      const newCreatures = prev.map(c => c.id === updated.id ? updated : c)
      saveSaveData({ creatures: newCreatures, activeCreatureId: activeCreatureIdRef.current })
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
      persistActiveCreature(hatched)
      setHatching(false)
      setPendingEvolution(false)
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
    const saved = await loadSaveData()
    if (!saved || saved.creatures.length === 0) return
    setCreatures(saved.creatures)
    const activeId = saved.activeCreatureId
    const activeCandidate = saved.creatures.find(c => c.id === activeId)
    const target = (activeCandidate && activeCandidate.isAlive)
      ? activeCandidate
      : saved.creatures.find(c => c.isAlive)
    if (!target) return // 全員死亡（起こらないはず）
    // Apply time catch-up
    const updated = applyTimeUpdate(target, false)
    const newCreatures = saved.creatures.map(c => c.id === updated.id ? updated : c)
    setCreatures(newCreatures)
    setActiveCreatureId(updated.id)
    saveSaveData({ creatures: newCreatures, activeCreatureId: updated.id })
    if (!updated.isAlive) {
      setScreen('death')
    } else {
      setScreen('main')
    }
  }, [])

  const handleStartGame = useCallback((newCreature: Creature) => {
    setCreatures(prev => {
      const newCreatures = [...prev, newCreature]
      saveSaveData({ creatures: newCreatures, activeCreatureId: newCreature.id })
      return newCreatures
    })
    setActiveCreatureId(newCreature.id)
    setScreen('main')
    setPendingEvolution(false)
  }, [])

  const handleFeed = useCallback(() => {
    if (!creatureRef.current) return
    if (creatureRef.current.hunger >= 100) {
      showMessage('お腹いっぱいで食べられない！')
      return
    }
    setShowFeedGame(true)
  }, [showMessage])

  const handleFeedDone = useCallback(() => {
    setShowFeedGame(false)
    if (!creatureRef.current) return
    const updated = feedCreature(creatureRef.current)
    persistActiveCreature(updated)
    showMessage('もぐもぐ！ご飯を食べた！')
  }, [persistActiveCreature, showMessage])

  const handleTrain = useCallback(() => {
    if (!creatureRef.current || creatureRef.current.isSleeping) return
    setShowTrainingGame(true)
  }, [])

  const handleTrainResult = useCallback((success: boolean) => {
    setShowTrainingGame(false)
    if (!creatureRef.current) return
    const updated = trainCreature(creatureRef.current, success)
    persistActiveCreature(updated)
    setAttackAnimation(true)
    showMessage(success ? 'トレーニング成功！大きく強くなった！' : 'トレーニング失敗…でも少し強くなった')
    setTimeout(() => setAttackAnimation(false), 1200)
  }, [persistActiveCreature, showMessage])

  const handlePlay = useCallback(() => {
    if (!creatureRef.current || creatureRef.current.isSleeping) return
    setShowPlayGame(true)
  }, [])

  const handlePlayResult = useCallback((success: boolean) => {
    setShowPlayGame(false)
    if (!creatureRef.current) return
    const updated = playWithCreature(creatureRef.current, success)
    persistActiveCreature(updated)
    showMessage(success ? '一緒に遊んだ！楽しかった！' : '一緒に遊んだ！少し楽しかった')
  }, [persistActiveCreature, showMessage])

  const handleSleep = useCallback(() => {
    if (!creatureRef.current) return
    const updated = toggleSleep(creatureRef.current)
    persistActiveCreature(updated)
    showMessage(updated.isSleeping ? 'おやすみなさい…' : 'おはよう！元気いっぱい！')
  }, [persistActiveCreature, showMessage])

  const handleEvolve = useCallback(() => {
    if (!creatureRef.current) return
    const prevStage = creatureRef.current.evolutionStage
    const evolved = evolveCreature(creatureRef.current)
    setEvolvedFrom(prevStage)
    persistActiveCreature(evolved)
    setPendingEvolution(false)
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
    setScreen('battle')
  }, [])

  const handleQrBattleStart = useCallback((opponentCreature: CreatureSnapshot, seed: number) => {
    setBattleRole('host')
    setBattleOpponent(opponentCreature)
    setBattleSeed(seed)
    setBattleMode('qr')
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
      saveSaveData({ creatures: newCreatures, activeCreatureId: alive.id })
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
      saveSaveData({ creatures: newCreatures, activeCreatureId: activeCreatureId! })
      return newCreatures
    })
  }, [creatures, activeCreatureId])

  const handleSelectCreature = useCallback((id: string) => {
    const target = creatures.find(c => c.id === id)
    if (!target || !target.isAlive) return
    const resetTarget = { ...target, lastUpdated: Date.now() }
    setCreatures(prev => {
      const newCreatures = prev.map(c => c.id === id ? resetTarget : c)
      saveSaveData({ creatures: newCreatures, activeCreatureId: id })
      return newCreatures
    })
    setActiveCreatureId(id)
    setScreen('main')
  }, [creatures])

  const handleLoadFromFile = useCallback((loaded: SaveData) => {
    setCreatures(loaded.creatures)
    const active = loaded.creatures.find(c => c.id === loaded.activeCreatureId) ?? loaded.creatures.find(c => c.isAlive)
    if (!active) return
    setActiveCreatureId(active.id)
    saveSaveData(loaded)
    setScreen('main')
    showMessage('セーブデータを読み込みました！')
  }, [showMessage])

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
      {screen === 'title' && (
        <TitleScreen
          hasExistingSave={hasExistingSave}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
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
          attackAnimation={attackAnimation}
          message={message}
          pendingEvolution={pendingEvolution}
          hatching={hatching}
          onFeed={handleFeed}
          onTrain={handleTrain}
          onPlay={handlePlay}
          onSleep={handleSleep}
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
          onLoad={handleLoadFromFile}
          onSelectCreature={handleSelectCreature}
          onDeleteCreature={handleDeleteCreature}
          onNewCreature={() => setScreen('setup')}
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

      {showTrainingGame && activeCreature && (
        <TrainingMiniGame creature={activeCreature} onResult={handleTrainResult} />
      )}
      {showPlayGame && activeCreature && (
        <PlayMiniGame creature={activeCreature} onResult={handlePlayResult} />
      )}
      {showFeedGame && activeCreature && (
        <FeedMiniGame creature={activeCreature} onDone={handleFeedDone} />
      )}
    </div>
  )
}

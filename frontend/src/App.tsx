import { useEffect, useState, useCallback, useRef } from 'react'
import type { Creature, GameScreen, EvolutionStage } from './types/creature'
import type { BattleRole, CreatureSnapshot, BattleResult } from './types/battle'
import { applyTimeUpdate } from './utils/gameLogic'
import { canEvolve, evolveCreature } from './utils/evolution'
import { saveCreature, loadCreature, deleteCreature } from './utils/storage'
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
import CreatureDrawingScreen from './components/CreatureDrawingScreen'
import { feedCreature, trainCreature, playWithCreature, toggleSleep } from './utils/gameLogic'

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title')
  const [creature, setCreature] = useState<Creature | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [attackAnimation, setAttackAnimation] = useState(false)
  const [pendingEvolution, setPendingEvolution] = useState(false)
  const [evolvedFrom, setEvolvedFrom] = useState<EvolutionStage | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [hasExistingSave, setHasExistingSave] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showTrainingGame, setShowTrainingGame] = useState(false)
  const [showPlayGame, setShowPlayGame] = useState(false)
  const [showFeedGame, setShowFeedGame] = useState(false)

  // Drawing state
  const [pendingCreature, setPendingCreature] = useState<Creature | null>(null)
  const [drawingStage, setDrawingStage] = useState<EvolutionStage | undefined>(undefined)

  // Battle state
  const [battleRole, setBattleRole] = useState<BattleRole | null>(null)
  const [battleOpponent, setBattleOpponent] = useState<CreatureSnapshot | null>(null)
  const [battleSeed, setBattleSeed] = useState<number>(0)
  const [battleRoomCode] = useState<string>('')

  const creatureRef = useRef<Creature | null>(null)
  const devModeRef = useRef(devMode)

  // Keep refs in sync
  useEffect(() => { creatureRef.current = creature }, [creature])
  useEffect(() => { devModeRef.current = devMode }, [devMode])

  // Load save on mount
  useEffect(() => {
    loadCreature().then(saved => {
      if (saved) setHasExistingSave(true)
      setLoading(false)
    })
  }, [])

  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }, [])

  const persistCreature = useCallback((c: Creature) => {
    setCreature(c)
    saveCreature(c)
    creatureRef.current = c
  }, [])

  // Time tick
  useEffect(() => {
    if (screen !== 'main') return

    const tickInterval = devModeRef.current ? 5000 : 30000

    const tick = () => {
      const current = creatureRef.current
      if (!current || !current.isAlive) return

      const updated = applyTimeUpdate(current, devModeRef.current)
      persistCreature(updated)

      if (!updated.isAlive) {
        setScreen('death')
        return
      }

      if (canEvolve(updated)) {
        setPendingEvolution(true)
      }
    }

    const id = setInterval(tick, tickInterval)
    return () => clearInterval(id)
  }, [screen, persistCreature])

  // Re-evaluate tick interval when devMode changes
  useEffect(() => {
    devModeRef.current = devMode
  }, [devMode])

  // Check evolution on creature change
  useEffect(() => {
    if (creature && screen === 'main') {
      if (canEvolve(creature)) {
        setPendingEvolution(true)
      } else {
        setPendingEvolution(false)
      }
    }
  }, [creature, screen])

  // --- Actions ---

  const handleNewGame = useCallback(() => {
    setScreen('setup')
    setPendingEvolution(false)
    setEvolvedFrom(null)
  }, [])

  const handleContinue = useCallback(async () => {
    const saved = await loadCreature()
    if (!saved) return
    // Apply time catch-up
    const updated = applyTimeUpdate(saved, false)
    persistCreature(updated)
    if (!updated.isAlive) {
      setScreen('death')
    } else {
      setScreen('main')
    }
  }, [persistCreature])

  const handleStartGame = useCallback((newCreature: Creature) => {
    // Start game directly; drawing happens when egg hatches (evolution)
    persistCreature(newCreature)
    setScreen('main')
    setPendingEvolution(false)
  }, [persistCreature])

  const handleDrawingComplete = useCallback((sprites: Partial<Record<EvolutionStage, string>>) => {
    const base = pendingCreature ?? creature!
    const mergedSprites = { ...base.customSprites, ...sprites }
    const withSprites: Creature = { ...base, customSprites: mergedSprites }
    persistCreature(withSprites)
    setPendingCreature(null)
    setDrawingStage(undefined)
    setScreen('main')
  }, [pendingCreature, creature, persistCreature])

  const handleDrawingSkip = useCallback(() => {
    const base = pendingCreature ?? creature!
    persistCreature(base)
    setPendingCreature(null)
    setDrawingStage(undefined)
    setScreen('main')
  }, [pendingCreature, creature, persistCreature])

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
    persistCreature(updated)
    showMessage('もぐもぐ！ご飯を食べた！🍖')
  }, [persistCreature, showMessage])

  const handleTrain = useCallback(() => {
    if (!creatureRef.current || creatureRef.current.isSleeping) return
    setShowTrainingGame(true)
  }, [])

  const handleTrainResult = useCallback((success: boolean) => {
    setShowTrainingGame(false)
    if (!creatureRef.current) return
    const updated = trainCreature(creatureRef.current, success)
    persistCreature(updated)
    setAttackAnimation(true)
    showMessage(success ? 'トレーニング成功！大きく強くなった！⚔️' : 'トレーニング失敗…でも少し強くなった')
    setTimeout(() => setAttackAnimation(false), 1200)
  }, [persistCreature, showMessage])

  const handlePlay = useCallback(() => {
    if (!creatureRef.current || creatureRef.current.isSleeping) return
    setShowPlayGame(true)
  }, [])

  const handlePlayResult = useCallback(() => {
    setShowPlayGame(false)
    if (!creatureRef.current) return
    const updated = playWithCreature(creatureRef.current)
    persistCreature(updated)
    showMessage('一緒に遊んだ！楽しかった！🎮')
  }, [persistCreature, showMessage])

  const handleSleep = useCallback(() => {
    if (!creatureRef.current) return
    const updated = toggleSleep(creatureRef.current)
    persistCreature(updated)
    showMessage(updated.isSleeping ? 'おやすみなさい…💤' : 'おはよう！元気いっぱい！☀️')
  }, [persistCreature, showMessage])

  const handleEvolve = useCallback(() => {
    if (!creatureRef.current) return
    const prevStage = creatureRef.current.evolutionStage
    const evolved = evolveCreature(creatureRef.current)
    setEvolvedFrom(prevStage)
    persistCreature(evolved)
    setPendingEvolution(false)
    setScreen('evolution')
  }, [persistCreature])

  const handleEvolutionContinue = useCallback(() => {
    // After evolution, show drawing screen for the new stage
    if (creature) {
      setDrawingStage(creature.evolutionStage)
      setScreen('drawing')
    } else {
      setScreen('main')
    }
    setEvolvedFrom(null)
  }, [creature])

  const handleBattle = useCallback(() => {
    setScreen('battle_lobby')
  }, [])

  const [isCpuBattle, setIsCpuBattle] = useState(false)

  const handleBattleStart = useCallback((role: BattleRole, opponentCreature: CreatureSnapshot, seed: number) => {
    setBattleRole(role)
    setBattleOpponent(opponentCreature)
    setBattleSeed(seed)
    setIsCpuBattle(false)
    setScreen('battle')
  }, [])

  const handleCpuBattleStart = useCallback((opponentCreature: CreatureSnapshot, seed: number) => {
    setBattleRole('host')
    setBattleOpponent(opponentCreature)
    setBattleSeed(seed)
    setIsCpuBattle(true)
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
    persistCreature(updated)
    setScreen('main')
    showMessage(result.result === 'win' ? '勝利！強さを証明した！' : result.result === 'lose' ? '敗北...次は勝つぞ！' : '引き分け...いい戦いだった')
  }, [persistCreature, showMessage])

  const handleStartOver = useCallback(async () => {
    await deleteCreature()
    setCreature(null)
    creatureRef.current = null
    setScreen('title')
    setPendingEvolution(false)
    setEvolvedFrom(null)
    setHasExistingSave(false)
  }, [])

  const handleLoadFromFile = useCallback((loaded: Creature) => {
    persistCreature(loaded)
    setScreen('main')
    showMessage('セーブデータを読み込みました！')
  }, [persistCreature, showMessage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center scanlines"
        style={{ background: '#1a1a2e' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">🥚</div>
          <div className="font-pixel" style={{ fontSize: '0.55rem', color: '#4fc3f7' }}>
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

      {screen === 'main' && creature && (
        <MainGame
          creature={creature}
          devMode={devMode}
          attackAnimation={attackAnimation}
          message={message}
          pendingEvolution={pendingEvolution}
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

      {screen === 'evolution' && creature && (
        <EvolutionScreen
          creature={creature}
          evolvedFrom={evolvedFrom}
          onContinue={handleEvolutionContinue}
        />
      )}

      {screen === 'death' && creature && (
        <DeathScreen
          creature={creature}
          onStartOver={handleStartOver}
        />
      )}

      {screen === 'status' && creature && (
        <StatusScreen
          creature={creature}
          onBack={() => setScreen('main')}
          onLoad={handleLoadFromFile}
        />
      )}
      {screen === 'drawing' && (pendingCreature || creature) && (
        <CreatureDrawingScreen
          creatureType={(pendingCreature ?? creature!).type}
          singleStage={drawingStage}
          onComplete={handleDrawingComplete}
          onSkip={handleDrawingSkip}
        />
      )}

      {screen === 'battle_lobby' && creature && (
        <BattleLobbyScreen
          creature={creature}
          onBattleStart={handleBattleStart}
          onCpuBattleStart={handleCpuBattleStart}
          onCancel={() => setScreen('main')}
        />
      )}

      {screen === 'battle' && creature && battleRole && battleOpponent && (
        <BattleScreen
          myCreature={{
            name: creature.name,
            evolutionStage: creature.evolutionStage,
            type: creature.type,
            hp: creature.hp,
            maxHp: creature.maxHp,
            atk: creature.atk,
            def: creature.def,
            spd: creature.spd,
            level: creature.level,
            customSvg: creature.customSprites?.[creature.evolutionStage],
          }}
          opponentCreature={battleOpponent}
          role={battleRole}
          seed={battleSeed}
          roomCode={battleRoomCode}
          onBattleEnd={handleBattleEnd}
          isCpuBattle={isCpuBattle}
        />
      )}

      {showTrainingGame && creature && (
        <TrainingMiniGame creature={creature} onResult={handleTrainResult} />
      )}
      {showPlayGame && creature && (
        <PlayMiniGame creature={creature} onResult={handlePlayResult} />
      )}
      {showFeedGame && creature && (
        <FeedMiniGame creature={creature} onDone={handleFeedDone} />
      )}
    </div>
  )
}

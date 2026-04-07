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
import CreatureDrawingScreen from './components/CreatureDrawingScreen'
import { feedCreature, trainCreature, playWithCreature, toggleSleep } from './utils/gameLogic'

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('title')
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [activeCreatureId, setActiveCreatureId] = useState<string | null>(null)
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
  const battleRoomCode = ''

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

      if (canEvolve(updated)) {
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
    if (activeCreature && screen === 'main') {
      if (canEvolve(activeCreature)) {
        setPendingEvolution(true)
      } else {
        setPendingEvolution(false)
      }
    }
  }, [activeCreature, screen])

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

  const handleDrawingComplete = useCallback((sprites: Partial<Record<EvolutionStage, string>>) => {
    const base = pendingCreature ?? activeCreature
    if (!base) return
    const mergedSprites = { ...base.customSprites, ...sprites }
    const withSprites: Creature = { ...base, customSprites: mergedSprites }
    persistActiveCreature(withSprites)
    setPendingCreature(null)
    setDrawingStage(undefined)
    setScreen('main')
  }, [pendingCreature, activeCreature, persistActiveCreature])

  const handleDrawingSkip = useCallback(() => {
    const base = pendingCreature ?? activeCreature
    if (!base) return
    persistActiveCreature(base)
    setPendingCreature(null)
    setDrawingStage(undefined)
    setScreen('main')
  }, [pendingCreature, activeCreature, persistActiveCreature])

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
    showMessage('もぐもぐ！ご飯を食べた！🍖')
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
    showMessage(success ? 'トレーニング成功！大きく強くなった！⚔️' : 'トレーニング失敗…でも少し強くなった')
    setTimeout(() => setAttackAnimation(false), 1200)
  }, [persistActiveCreature, showMessage])

  const handlePlay = useCallback(() => {
    if (!creatureRef.current || creatureRef.current.isSleeping) return
    setShowPlayGame(true)
  }, [])

  const handlePlayResult = useCallback(() => {
    setShowPlayGame(false)
    if (!creatureRef.current) return
    const updated = playWithCreature(creatureRef.current)
    persistActiveCreature(updated)
    showMessage('一緒に遊んだ！楽しかった！🎮')
  }, [persistActiveCreature, showMessage])

  const handleSleep = useCallback(() => {
    if (!creatureRef.current) return
    const updated = toggleSleep(creatureRef.current)
    persistActiveCreature(updated)
    showMessage(updated.isSleeping ? 'おやすみなさい…💤' : 'おはよう！元気いっぱい！☀️')
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
    // After evolution, show drawing screen for the new stage
    if (activeCreature) {
      setDrawingStage(activeCreature.evolutionStage)
      setScreen('drawing')
    } else {
      setScreen('main')
    }
    setEvolvedFrom(null)
  }, [activeCreature])

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

      {screen === 'main' && activeCreature && (
        <MainGame
          creature={activeCreature}
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
          onNewCreature={() => setScreen('setup')}
        />
      )}
      {screen === 'drawing' && (pendingCreature || activeCreature) && (
        <CreatureDrawingScreen
          creatureType={(pendingCreature ?? activeCreature!).type}
          singleStage={drawingStage}
          onComplete={handleDrawingComplete}
          onSkip={handleDrawingSkip}
        />
      )}

      {screen === 'battle_lobby' && activeCreature && (
        <BattleLobbyScreen
          creature={activeCreature}
          onBattleStart={handleBattleStart}
          onCpuBattleStart={handleCpuBattleStart}
          onCancel={() => setScreen('main')}
        />
      )}

      {screen === 'battle' && activeCreature && battleRole && battleOpponent && (
        <BattleScreen
          myCreature={{
            name: activeCreature.name,
            evolutionStage: activeCreature.evolutionStage,
            type: activeCreature.type,
            hp: activeCreature.hp,
            maxHp: activeCreature.maxHp,
            atk: activeCreature.atk,
            def: activeCreature.def,
            spd: activeCreature.spd,
            level: activeCreature.level,
            customSvg: activeCreature.customSprites?.[activeCreature.evolutionStage],
          }}
          opponentCreature={battleOpponent}
          role={battleRole}
          seed={battleSeed}
          roomCode={battleRoomCode}
          onBattleEnd={handleBattleEnd}
          isCpuBattle={isCpuBattle}
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

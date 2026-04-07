import React from 'react' // needed for JSX Fragment
import type { Creature } from '../types/creature'
import { TYPE_COLORS, TYPE_EMOJIS, STAGE_NAMES, EVOLUTION_NAMES } from '../data/evolutions'
import { EXP_TO_LEVEL } from '../data/evolutions'
import { canEvolve, getEvolutionProgress } from '../utils/evolution'
import { exportSave, importSave } from '../utils/storage'
import type { SaveData } from '../utils/storage'

interface StatusScreenProps {
  creature: Creature
  allCreatures: Creature[]
  activeCreatureId: string
  onBack: () => void
  onLoad: (saveData: SaveData) => void
  onSelectCreature: (id: string) => void
  onNewCreature: () => void
}

export default function StatusScreen({ creature, allCreatures, activeCreatureId, onBack, onLoad, onSelectCreature, onNewCreature }: StatusScreenProps) {
  const color = TYPE_COLORS[creature.type]
  const expNeeded = EXP_TO_LEVEL(creature.level)
  const evolutionChecks = getEvolutionProgress(creature)
  const canEvolveNow = canEvolve(creature)

  const handleExport = async () => {
    await exportSave({ creatures: allCreatures, activeCreatureId })
  }

  const handleImport = async () => {
    const loaded = await importSave()
    if (loaded) {
      onLoad(loaded)
    }
  }

  const statRows = [
    { label: 'HP', value: `${creature.hp} / ${creature.maxHp}` },
    { label: 'ATK（攻撃力）', value: creature.atk },
    { label: 'DEF（防御力）', value: creature.def },
    { label: 'SPD（素早さ）', value: creature.spd },
    { label: 'LV（レベル）', value: creature.level },
    { label: 'EXP', value: `${creature.exp} / ${expNeeded}` },
    { label: '年齢', value: `${Math.floor(creature.age)}日` },
    { label: '体重', value: `${creature.weight}kg` },
    { label: '空腹度', value: `${Math.floor(creature.hunger)}/100` },
    { label: '幸福度', value: `${Math.floor(creature.happiness)}/100` },
  ]

  const evolutionPath = EVOLUTION_NAMES[creature.type]

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-4 overflow-y-auto"
      style={{ background: '#1a1a2e', maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="font-pixel px-3 py-2 rounded-lg transition-all active:scale-95"
          style={{
            fontSize: '0.55rem',
            background: '#16213e',
            border: '1px solid #334155',
            color: '#94a3b8',
          }}
        >
          ← もどる
        </button>
        <h2 className="font-pixel" style={{ fontSize: '0.7rem', color }}>
          {TYPE_EMOJIS[creature.type]} ステータス
        </h2>
      </div>

      {/* Creature identity */}
      <div
        className="px-4 py-3 rounded-xl mb-4"
        style={{ background: '#16213e', border: `2px solid ${color}44` }}
      >
        <div className="flex items-center gap-3">
          <div style={{ fontSize: 40 }}>{TYPE_EMOJIS[creature.type]}</div>
          <div>
            <div className="font-pixel" style={{ fontSize: '0.85rem', color: '#e0e0e0' }}>{creature.name}</div>
            <div className="font-pixel mt-1" style={{ fontSize: '0.5rem', color }}>
              {creature.evolutionName}
            </div>
            <div className="font-pixel mt-0.5" style={{ fontSize: '0.45rem', color: '#64748b' }}>
              {STAGE_NAMES[creature.evolutionStage]} | {creature.type}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.55rem', color }}>ステータス詳細</div>
        {statRows.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center py-1.5"
            style={{ borderBottom: '1px solid #0f3460' }}
          >
            <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</span>
            <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#e0e0e0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Activity stats */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.55rem', color }}>活動記録</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '食事', value: creature.feedCount, icon: '🍖' },
            { label: 'トレーニング', value: creature.trainCount, icon: '⚔️' },
            { label: '遊び', value: creature.playCount, icon: '🎮' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center">
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div className="font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>{label}</div>
              <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#e0e0e0' }}>{value}回</div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution path */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.55rem', color }}>進化系統</div>
        <div className="flex flex-wrap gap-1">
          {evolutionPath.map((ename, i) => (
            <React.Fragment key={i}>
              <span
                className="font-pixel px-2 py-1 rounded"
                style={{
                  fontSize: '0.4rem',
                  background: i === creature.evolutionStage ? `${color}33` : 'transparent',
                  color: i === creature.evolutionStage ? color : i < creature.evolutionStage ? '#475569' : '#334155',
                  border: i === creature.evolutionStage ? `1px solid ${color}` : '1px solid transparent',
                }}
              >
                {ename}
              </span>
              {i < evolutionPath.length - 1 && (
                <span style={{ color: '#334155', fontSize: '0.5rem', alignSelf: 'center' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Evolution conditions */}
      {creature.evolutionStage < 5 && (
        <div className="px-4 py-3 rounded-xl mb-4" style={{
          background: '#16213e',
          border: `1px solid ${canEvolveNow ? '#ffd70044' : '#0f3460'}`,
        }}>
          <div className="font-pixel mb-3" style={{
            fontSize: '0.55rem',
            color: canEvolveNow ? '#ffd700' : color,
          }}>
            {canEvolveNow ? '⭐ 進化条件達成！' : '進化条件'}
          </div>
          {evolutionChecks.map(({ label, met, value, max }) => (
            <div key={label} className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 14 }}>{met ? '✅' : '❌'}</span>
              <span className="font-pixel flex-1" style={{ fontSize: '0.45rem', color: met ? '#4ade80' : '#64748b' }}>
                {label}
              </span>
              <span className="font-pixel" style={{ fontSize: '0.45rem', color: met ? '#4ade80' : '#94a3b8' }}>
                {typeof value === 'number' ? Math.floor(value * 10) / 10 : value}/{max}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Creature list */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.55rem', color }}>クリーチャー一覧</div>
        {allCreatures.map(c => {
          const isActive = c.id === activeCreatureId
          const isDead = c.isAlive === false
          const isClickable = !isDead && !isActive
          const cColor = TYPE_COLORS[c.type]

          const content = (
            <>
              <div style={{ fontSize: 22 }}>{isDead ? '🪦' : TYPE_EMOJIS[c.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-pixel" style={{ fontSize: '0.5rem', color: '#e0e0e0' }}>{c.name}</div>
                <div className="font-pixel mt-0.5" style={{ fontSize: '0.4rem', color: isDead ? '#475569' : cColor }}>
                  {c.evolutionName}
                </div>
                <div className="font-pixel mt-0.5" style={{ fontSize: '0.38rem', color: '#475569' }}>
                  {STAGE_NAMES[c.evolutionStage]}
                </div>
              </div>
              {isActive && (
                <span
                  className="font-pixel px-2 py-1 rounded"
                  style={{
                    fontSize: '0.38rem',
                    background: `${cColor}33`,
                    color: cColor,
                    border: `1px solid ${cColor}66`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  育成中
                </span>
              )}
            </>
          )

          const commonStyle = {
            background: isActive ? `${cColor}11` : 'transparent',
            borderLeft: isActive ? `3px solid ${cColor}` : '3px solid transparent',
            opacity: isDead ? 0.5 : 1,
            cursor: isClickable ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }

          if (isClickable) {
            return (
              <button
                key={c.id}
                onClick={() => onSelectCreature(c.id)}
                className="flex items-center gap-3 py-2 px-2 rounded-lg mb-2 w-full text-left"
                style={commonStyle}
              >
                {content}
              </button>
            )
          }
          return (
            <div key={c.id} className="flex items-center gap-3 py-2 px-2 rounded-lg mb-2" style={commonStyle}>
              {content}
            </div>
          )
        })}
        <button
          onClick={onNewCreature}
          className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 mt-1"
          style={{
            fontSize: '0.5rem',
            background: 'transparent',
            border: '1px dashed #4fc3f766',
            color: '#4fc3f7',
          }}
        >
          ＋ 新しいクリーチャーを育てる
        </button>
      </div>

      {/* Save/Load buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleExport}
          className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
          style={{
            fontSize: '0.55rem',
            background: '#16213e',
            border: '1px solid #4ade8066',
            color: '#4ade80',
          }}
        >
          💾 セーブデータ出力
        </button>
        <button
          onClick={handleImport}
          className="flex-1 py-3 rounded-lg font-pixel transition-all active:scale-95"
          style={{
            fontSize: '0.55rem',
            background: '#16213e',
            border: '1px solid #fb923c66',
            color: '#fb923c',
          }}
        >
          📂 セーブデータ読込
        </button>
      </div>
    </div>
  )
}

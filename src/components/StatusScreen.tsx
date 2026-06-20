import React from 'react' // needed for JSX Fragment
import type { Creature } from '../types/creature'
import { BRANCH_COLORS, BRANCH_NAMES, STAGE_NAMES, CREATURE_TREE, getCreatureBranch } from '../data/evolutions'
import { EXP_TO_LEVEL } from '../data/evolutions'
import { canEvolve, getEvolutionProgress } from '../utils/evolution'

interface StatusScreenProps {
  creature: Creature
  allCreatures: Creature[]
  activeCreatureId: string
  onBack: () => void
  onSelectCreature: (id: string) => void
  onDeleteCreature: (id: string) => void
  onNewCreature: () => void
  onZukan?: () => void
}

const MAX_CREATURES = 5

function TypeDot({ color, size }: { color: string; size: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}

export default function StatusScreen({ creature, allCreatures, activeCreatureId, onBack, onSelectCreature, onDeleteCreature, onNewCreature, onZukan }: StatusScreenProps) {
  const canAddCreature = allCreatures.length < MAX_CREATURES
  const branch = getCreatureBranch(creature.creatureId)
  const color = BRANCH_COLORS[branch]
  const expNeeded = EXP_TO_LEVEL(creature.level)
  const evolutionChecks = getEvolutionProgress(creature).filter(c => c.label !== '幸福度')
  const canEvolveNow = canEvolve(creature)

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
  ]

  const currentDef = CREATURE_TREE[creature.creatureId]
  const evolutionPath: string[] = [currentDef.name, ...currentDef.evolvesTo.map(id => CREATURE_TREE[id].name)]

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-4 overflow-y-auto"
      style={{ background: '#1a1a2e', maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="font-pixel px-3 py-2 rounded-lg transition-all active:scale-95"
            style={{
              fontSize: '0.75rem',
              background: '#16213e',
              border: '1px solid #334155',
              color: '#94a3b8',
            }}
          >
            &lt; もどる
          </button>
          <h2 className="font-pixel flex items-center gap-2" style={{ fontSize: '1rem', color }}>
            <TypeDot color={color} size={14} /> ステータス
          </h2>
        </div>
        {onZukan && (
          <button
            onClick={onZukan}
            className="font-pixel px-3 py-2 rounded-lg transition-all active:scale-95"
            style={{
              fontSize: '0.65rem',
              background: '#16213e',
              border: '1px solid #ffd70055',
              color: '#ffd700',
            }}
          >
            図鑑
          </button>
        )}
      </div>

      {/* Creature identity */}
      <div
        className="px-4 py-3 rounded-xl mb-4"
        style={{ background: '#16213e', border: `2px solid ${color}44` }}
      >
        <div className="flex items-center gap-3">
          <TypeDot color={color} size={40} />
          <div>
            <div className="font-pixel" style={{ fontSize: '1.15rem', color: '#e0e0e0' }}>{creature.name}</div>
            <div className="font-pixel mt-1" style={{ fontSize: '0.7rem', color }}>
              {creature.evolutionName}
            </div>
            <div className="font-pixel mt-0.5" style={{ fontSize: '0.55rem', color: '#64748b' }}>
              {STAGE_NAMES[creature.evolutionStage]} | {BRANCH_NAMES[branch]}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.75rem', color }}>ステータス詳細</div>
        {statRows.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center py-1.5"
            style={{ borderBottom: '1px solid #0f3460' }}
          >
            <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#64748b' }}>{label}</span>
            <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#e0e0e0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Activity stats */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.75rem', color }}>活動記録</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '食事', value: creature.feedCount },
            { label: 'トレーニング', value: creature.trainCount },
            { label: '遊び', value: creature.playCount },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>{label}</div>
              <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#e0e0e0' }}>{value}回</div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution path */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.75rem', color }}>進化系統</div>
        <div className="flex flex-wrap gap-1">
          {evolutionPath.map((ename, i) => (
            <React.Fragment key={i}>
              <span
                className="font-pixel px-2 py-1 rounded"
                style={{
                  fontSize: '0.5rem',
                  background: i === 0 ? `${color}33` : 'transparent',
                  color: i === 0 ? color : '#334155',
                  border: i === 0 ? `1px solid ${color}` : '1px solid transparent',
                }}
              >
                {ename}
              </span>
              {i < evolutionPath.length - 1 && (
                <span style={{ color: '#334155', fontSize: '0.6rem', alignSelf: 'center' }}>&gt;</span>
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
            fontSize: '0.75rem',
            color: canEvolveNow ? '#ffd700' : color,
          }}>
            {canEvolveNow ? '進化条件達成！' : '進化条件'}
          </div>
          {evolutionChecks.map(({ label, met, value, max }) => (
            <div key={label} className="flex items-center gap-2 mb-2">
              <span className="font-pixel" style={{ fontSize: '0.55rem', color: met ? '#4ade80' : '#f87171' }}>{met ? '達成' : '未達'}</span>
              <span className="font-pixel flex-1" style={{ fontSize: '0.55rem', color: met ? '#4ade80' : '#64748b' }}>
                {label}
              </span>
              <span className="font-pixel" style={{ fontSize: '0.55rem', color: met ? '#4ade80' : '#94a3b8' }}>
                {typeof value === 'number' ? Math.floor(value * 10) / 10 : value}/{max}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Creature list */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-3" style={{ fontSize: '0.75rem', color }}>クリーチャー一覧</div>
        {allCreatures.map(c => {
          const isActive = c.id === activeCreatureId
          const isDead = c.isAlive === false
          const isClickable = !isDead && !isActive
          const cColor = BRANCH_COLORS[getCreatureBranch(c.creatureId)]

          const content = (
            <>
              <TypeDot color={isDead ? '#475569' : cColor} size={22} />
              <div className="flex-1 min-w-0">
                <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#e0e0e0' }}>{c.name}</div>
                <div className="font-pixel mt-0.5" style={{ fontSize: '0.55rem', color: isDead ? '#475569' : cColor }}>
                  {c.evolutionName}
                </div>
                <div className="font-pixel mt-0.5" style={{ fontSize: '0.6rem', color: '#475569' }}>
                  {STAGE_NAMES[c.evolutionStage]}
                </div>
              </div>
              {isActive ? (
                <span
                  className="font-pixel px-2 py-1 rounded"
                  style={{
                    fontSize: '0.6rem',
                    background: `${cColor}33`,
                    color: cColor,
                    border: `1px solid ${cColor}66`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  育成中
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCreature(c.id) }}
                  className="font-pixel px-2 py-1 rounded transition-all active:scale-95"
                  style={{
                    fontSize: '0.6rem',
                    background: 'transparent',
                    border: '1px solid #ef444466',
                    color: '#ef4444',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  削除
                </button>
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
          disabled={!canAddCreature}
          className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 mt-1"
          style={{
            fontSize: '0.65rem',
            background: 'transparent',
            border: `1px dashed ${canAddCreature ? '#4fc3f766' : '#ffffff33'}`,
            color: canAddCreature ? '#4fc3f7' : '#ffffff44',
            cursor: canAddCreature ? 'pointer' : 'not-allowed',
          }}
        >
          {canAddCreature
            ? '+ 新しいクリーチャーを育てる'
            : `上限${MAX_CREATURES}体に達しています`}
        </button>
      </div>

    </div>
  )
}

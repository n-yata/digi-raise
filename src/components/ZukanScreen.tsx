import { useState } from 'react'
import type { CreatureId, EvolutionStage } from '../types/creature'
import {
  CREATURE_TREE, STAGE_NAMES, BRANCH_COLORS, BRANCH_NAMES,
  getCreatureBranch, BASE_STATS,
} from '../data/evolutions'
import CreatureSprite from './CreatureSprite'
import type { AnimState } from './creatures/DefaultCreatureBody'

const ZUKAN_ORDER: CreatureId[] = [
  'egg',
  'baby',
  'childA', 'childB', 'childC',
  'adultA1', 'adultA2', 'adultB1', 'adultB2', 'adultC1', 'adultC2',
  'perfectA1', 'perfectA2', 'perfectB1', 'perfectB2', 'perfectC1', 'perfectC2',
  'ultimateA', 'ultimateB', 'ultimateC',
]

const REACTIONS: { state: AnimState; label: string }[] = [
  { state: 'idle',     label: '通常' },
  { state: 'happy',    label: '喜び' },
  { state: 'sleeping', label: '睡眠' },
  { state: 'attack',   label: '攻撃' },
  { state: 'sad',      label: '悲しみ' },
  { state: 'hungry',   label: '空腹' },
]

const STAGES: EvolutionStage[] = [0, 1, 2, 3, 4, 5]

interface ZukanScreenProps {
  discoveredCreatures: ReadonlySet<CreatureId>
  devMode: boolean
  onBack: () => void
}

// ─────────────────────────────────────────────
// Detail panel (overlay)
// ─────────────────────────────────────────────
function ZukanDetail({ id, onClose }: { id: CreatureId; onClose: () => void }) {
  const def = CREATURE_TREE[id]
  const branch = getCreatureBranch(id)
  const color = BRANCH_COLORS[branch]
  const baseStats = BASE_STATS[def.stage]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,26,0.92)' }}
      onClick={onClose}
    >
      <div
        className="mt-auto w-full rounded-t-2xl overflow-y-auto"
        style={{
          background: '#16213e',
          border: `2px solid ${color}44`,
          borderBottom: 'none',
          maxHeight: '88vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${color}22` }}>
          <div>
            <div className="font-pixel" style={{ fontSize: '1rem', color }}>{def.name}</div>
            <div className="font-pixel mt-0.5" style={{ fontSize: '0.6rem', color: '#64748b' }}>
              {STAGE_NAMES[def.stage]}
              {branch !== 'none' && ` ／ ${BRANCH_NAMES[branch]}系`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-pixel px-3 py-2 rounded-lg"
            style={{ fontSize: '0.7rem', color: '#64748b', border: '1px solid #334155', background: '#1a1a2e' }}
          >
            ✕ 閉じる
          </button>
        </div>

        {/* Hero sprite */}
        <div className="flex justify-center py-4" style={{ background: `radial-gradient(circle, ${color}11 0%, transparent 70%)` }}>
          <CreatureSprite
            creatureId={id}
            stage={def.stage}
            animState="idle"
            sizeOverride={96}
            hideShadow
          />
        </div>

        {/* Base stats */}
        <div className="px-4 pb-3">
          <div className="font-pixel mb-2" style={{ fontSize: '0.65rem', color }}>基本ステータス</div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { label: 'HP',  value: baseStats.hp },
                { label: 'ATK', value: baseStats.atk },
                { label: 'DEF', value: baseStats.def },
                { label: 'SPD', value: baseStats.spd },
              ] as const
            ).map(({ label, value }) => (
              <div
                key={label}
                className="text-center py-2 rounded-lg"
                style={{ background: '#0f3460', border: `1px solid ${color}22` }}
              >
                <div className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>{label}</div>
                <div className="font-pixel mt-0.5" style={{ fontSize: '0.75rem', color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reaction grid */}
        <div className="px-4 pb-6">
          <div className="font-pixel mb-2" style={{ fontSize: '0.65rem', color }}>リアクション</div>
          <div className="grid grid-cols-3 gap-2">
            {REACTIONS.map(({ state, label }) => (
              <div
                key={state}
                className="flex flex-col items-center py-2 rounded-lg"
                style={{ background: '#0f3460', border: `1px solid ${color}22` }}
              >
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreatureSprite
                    creatureId={id}
                    stage={def.stage}
                    animState={state}
                    sizeOverride={56}
                    hideShadow
                  />
                </div>
                <div className="font-pixel mt-1" style={{ fontSize: '0.5rem', color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Single creature card in the grid
// ─────────────────────────────────────────────
function CreatureCard({
  id, unlocked, selected, onClick,
}: {
  id: CreatureId
  unlocked: boolean
  selected: boolean
  onClick: () => void
}) {
  const def = CREATURE_TREE[id]
  const branch = getCreatureBranch(id)
  const color = unlocked ? BRANCH_COLORS[branch] : '#334155'

  return (
    <button
      onClick={unlocked ? onClick : undefined}
      className="flex flex-col items-center py-3 px-1 rounded-xl transition-all active:scale-95"
      style={{
        background: selected ? `${color}22` : '#0f3460',
        border: `1px solid ${selected ? color : color + '44'}`,
        cursor: unlocked ? 'pointer' : 'default',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      {/* Sprite or silhouette */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ filter: unlocked ? 'none' : 'brightness(0) opacity(0.25)' }}>
          <CreatureSprite
            creatureId={id}
            stage={def.stage}
            animState="idle"
            sizeOverride={48}
            hideShadow
          />
        </div>
      </div>
      {/* Name */}
      <div
        className="font-pixel mt-1 text-center leading-tight"
        style={{ fontSize: '0.5rem', color: unlocked ? color : '#334155' }}
      >
        {unlocked ? def.name : '???'}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// Main ZukanScreen
// ─────────────────────────────────────────────
export default function ZukanScreen({ discoveredCreatures, devMode, onBack }: ZukanScreenProps) {
  const [selectedId, setSelectedId] = useState<CreatureId | null>(null)

  const isUnlocked = (id: CreatureId) => devMode || discoveredCreatures.has(id)
  const unlockedCount = devMode ? ZUKAN_ORDER.length : discoveredCreatures.size

  const byStage = STAGES.map((stage) => ({
    stage,
    ids: ZUKAN_ORDER.filter((id) => CREATURE_TREE[id].stage === stage),
  }))

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
            style={{ fontSize: '0.75rem', background: '#16213e', border: '1px solid #334155', color: '#94a3b8' }}
          >
            &lt; もどる
          </button>
          <h2 className="font-pixel" style={{ fontSize: '1rem', color: '#ffd700' }}>
            図鑑
          </h2>
        </div>
        <div className="font-pixel" style={{ fontSize: '0.65rem', color: '#64748b' }}>
          {unlockedCount} / {ZUKAN_ORDER.length}
          {devMode && (
            <span className="ml-1" style={{ color: '#ffd700' }}>[DEV]</span>
          )}
        </div>
      </div>

      {/* Stage sections */}
      {byStage.map(({ stage, ids }) => (
        <div key={stage} className="mb-5">
          <div
            className="font-pixel mb-2 px-1"
            style={{ fontSize: '0.65rem', color: '#4fc3f7', borderBottom: '1px solid #0f3460', paddingBottom: 4 }}
          >
            Stage {stage} — {STAGE_NAMES[stage]}
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(ids.length, 3)}, 1fr)` }}
          >
            {ids.map((id) => (
              <CreatureCard
                key={id}
                id={id}
                unlocked={isUnlocked(id)}
                selected={selectedId === id}
                onClick={() => setSelectedId(selectedId === id ? null : id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Detail overlay */}
      {selectedId && (
        <ZukanDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

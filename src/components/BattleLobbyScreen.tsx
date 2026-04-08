import { useState, useEffect } from 'react'
import type { Creature } from '../types/creature'
import type { CreatureSnapshot } from '../types/battle'
import { generateCpuCreature } from '../utils/cpuBattle'
import QRCreatureScan from './QRCreatureScan'

interface BattleLobbyScreenProps {
  creature: Creature
  onCpuBattleStart: (opponentCreature: CreatureSnapshot, seed: number) => void
  onQrBattleStart: (opponentCreature: CreatureSnapshot, seed: number) => void
  onCancel: () => void
}

type LobbyTab = 'cpu' | 'qr'

export default function BattleLobbyScreen({ creature, onCpuBattleStart, onQrBattleStart, onCancel }: BattleLobbyScreenProps) {
  const [tab, setTab] = useState<LobbyTab>('cpu')
  const [cpuOpponent, setCpuOpponent] = useState<CreatureSnapshot | null>(null)

  // CPU対戦相手を生成
  useEffect(() => {
    const playerSnapshot: CreatureSnapshot = {
      name: creature.name,
      evolutionStage: creature.evolutionStage,
      type: creature.type,
      hp: creature.hp,
      maxHp: creature.maxHp,
      atk: creature.atk,
      def: creature.def,
      spd: creature.spd,
      level: creature.level,
    }
    setCpuOpponent(generateCpuCreature(playerSnapshot))
  }, [creature])

  const handleRegenerateCpu = () => {
    const playerSnapshot: CreatureSnapshot = {
      name: creature.name,
      evolutionStage: creature.evolutionStage,
      type: creature.type,
      hp: creature.hp,
      maxHp: creature.maxHp,
      atk: creature.atk,
      def: creature.def,
      spd: creature.spd,
      level: creature.level,
    }
    setCpuOpponent(generateCpuCreature(playerSnapshot))
  }

  const handleCpuBattleStart = () => {
    if (!cpuOpponent) return
    const seed = Date.now()
    onCpuBattleStart(cpuOpponent, seed)
  }

  const handleQrOpponentScanned = (opponent: CreatureSnapshot) => {
    onQrBattleStart(opponent, Date.now())
  }

  const mySnapshot: CreatureSnapshot = {
    name: creature.name,
    evolutionStage: creature.evolutionStage,
    type: creature.type,
    hp: creature.hp,
    maxHp: creature.maxHp,
    atk: creature.atk,
    def: creature.def,
    spd: creature.spd,
    level: creature.level,
  }

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: '#1a1a2e', maxWidth: 420, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #0f346044' }}>
        <div className="flex items-center justify-between">
          <div className="font-pixel" style={{ fontSize: '1rem', color: '#4fc3f7' }}>
            バトルロビー
          </div>
          <button
            onClick={onCancel}
            className="font-pixel px-3 py-1 rounded transition-all active:scale-95"
            style={{
              fontSize: '0.65rem',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid #f8717166',
              color: '#f87171',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>

      {/* 自分のクリーチャー情報 */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-lg" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
        <div className="font-pixel mb-1" style={{ fontSize: '0.65rem', color: '#64748b' }}>
          あなたのクリーチャー
        </div>
        <div className="flex justify-between items-center">
          <span className="font-pixel" style={{ fontSize: '0.7rem', color: '#e0e0e0' }}>
            {creature.name}
          </span>
          <div className="flex gap-3">
            {[
              { label: 'HP', value: creature.hp },
              { label: 'ATK', value: creature.atk },
              { label: 'DEF', value: creature.def },
              { label: 'SPD', value: creature.spd },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</span>
                <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#4fc3f7' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div
        className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden"
        style={{ background: '#16213e', border: '1px solid #0f3460' }}
      >
        {(['cpu', 'qr'] as LobbyTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="py-2 font-pixel transition-all"
            style={{
              fontSize: '0.65rem',
              background: tab === t ? '#0f3460' : 'transparent',
              color: tab === t ? '#4fc3f7' : '#64748b',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t === 'cpu' ? 'CPU対戦' : 'QR対戦'}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="mx-4 mt-3 flex-1">
        {/* CPU対戦 */}
        {tab === 'cpu' && cpuOpponent && (
          <div className="flex flex-col gap-3">
            <div className="px-3 py-3 rounded-lg" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
              <div className="font-pixel mb-2" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                対戦相手（CPU）
              </div>
              <div className="flex justify-between items-center">
                <span className="font-pixel" style={{ fontSize: '0.7rem', color: '#e0e0e0' }}>
                  {cpuOpponent.name}
                </span>
                <div className="flex gap-3">
                  {[
                    { label: 'HP', value: cpuOpponent.maxHp },
                    { label: 'ATK', value: cpuOpponent.atk },
                    { label: 'DEF', value: cpuOpponent.def },
                    { label: 'SPD', value: cpuOpponent.spd },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#64748b' }}>{label}</span>
                      <span className="font-pixel" style={{ fontSize: '0.65rem', color: '#4fc3f7' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="font-pixel mt-2" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                タイプ: {cpuOpponent.type} / Lv.{cpuOpponent.level}
              </div>
            </div>

            <button
              onClick={handleRegenerateCpu}
              className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95"
              style={{
                fontSize: '0.65rem',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid #64748b44',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              対戦相手を変更
            </button>

            <button
              onClick={handleCpuBattleStart}
              className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
              style={{
                fontSize: '0.75rem',
                background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
                backgroundSize: '200% 100%',
                border: '2px solid #ffd700',
                color: '#111',
                boxShadow: '0 0 20px #ffd70088',
                cursor: 'pointer',
              }}
            >
              CPUバトル開始！
            </button>
          </div>
        )}

        {/* QR対戦 */}
        {tab === 'qr' && (
          <QRCreatureScan
            myCreature={mySnapshot}
            onOpponentScanned={handleQrOpponentScanned}
            onCancel={() => setTab('cpu')}
          />
        )}
      </div>
    </div>
  )
}

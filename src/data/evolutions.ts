import type { CreatureType, EvolutionStage } from '../types/creature'

export const EVOLUTION_NAMES: Record<CreatureType, string[]> = {
  Fire:    ['タマゴ', 'ホノカ', 'フレイモン', 'バーニモン', 'インフェルノモン', 'エンペラーモン'],
  Water:   ['タマゴ', 'ミズカ', 'アクアモン', 'マリンモン', 'ポセイドモン', 'オーシャンモン'],
  Plant:   ['タマゴ', 'ハナカ', 'リーフモン', 'フローラモン', 'ガーデンモン', 'エデンモン'],
  Thunder: ['タマゴ', 'カミカ', 'サンダモン', 'ライトニモン', 'ストームモン', 'インドラモン'],
  Dark:    ['タマゴ', 'ヤミカ', 'シャドモン', 'ダークモン', 'カオスモン', 'ルシフェモン'],
  Light:   ['タマゴ', 'ヒカリカ', 'エンジェモン', 'セイントモン', 'アルケモン', 'セラフィモン'],
}

export const STAGE_NAMES: Record<EvolutionStage, string> = {
  0: 'タマゴ',
  1: 'ベイビー',
  2: 'チャイルド',
  3: 'アダルト',
  4: 'パーフェクト',
  5: 'アルティメット',
}

export const TYPE_COLORS: Record<CreatureType, string> = {
  Fire:    '#ff6b35',
  Water:   '#4fc3f7',
  Plant:   '#81c784',
  Thunder: '#ffd54f',
  Dark:    '#ce93d8',
  Light:   '#fff9c4',
}

export const TYPE_EMOJIS: Record<CreatureType, string> = {
  Fire:    '🔥',
  Water:   '💧',
  Plant:   '🌿',
  Thunder: '⚡',
  Dark:    '🌑',
  Light:   '✨',
}

export const TYPE_BG_COLORS: Record<CreatureType, string> = {
  Fire:    'rgba(255, 107, 53, 0.15)',
  Water:   'rgba(79, 195, 247, 0.15)',
  Plant:   'rgba(129, 199, 132, 0.15)',
  Thunder: 'rgba(255, 213, 79, 0.15)',
  Dark:    'rgba(206, 147, 216, 0.15)',
  Light:   'rgba(255, 249, 196, 0.15)',
}

export interface EvolutionRequirement {
  minAge: number
  minHappiness?: number
  minLevel?: number
  minCombatStats?: number // atk+def+spd
  minEachStat?: number    // each of atk,def,spd
}

export const EVOLUTION_REQUIREMENTS: Record<number, EvolutionRequirement> = {
  1: { minAge: 1 },                                                          // Baby -> Child
  2: { minAge: 3, minHappiness: 50 },                                       // Child -> Adult
  3: { minAge: 7, minLevel: 10, minCombatStats: 60 },                      // Adult -> Perfect
  4: { minAge: 14, minLevel: 20, minEachStat: 30 },                        // Perfect -> Ultimate
}

export const EXP_TO_LEVEL: (level: number) => number = (level) => level * 20

export const BASE_STATS: Record<EvolutionStage, { hp: number; atk: number; def: number; spd: number }> = {
  0: { hp: 20,  atk: 2,  def: 2,  spd: 2  },
  1: { hp: 40,  atk: 5,  def: 5,  spd: 5  },
  2: { hp: 80,  atk: 12, def: 10, spd: 10 },
  3: { hp: 150, atk: 25, def: 20, spd: 20 },
  4: { hp: 250, atk: 45, def: 40, spd: 35 },
  5: { hp: 400, atk: 70, def: 60, spd: 55 },
}

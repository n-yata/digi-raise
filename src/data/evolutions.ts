import type { CreatureId, EvolutionStage } from '../types/creature'

export type CreatureBranch = 'A' | 'B' | 'C' | 'none'

export function getCreatureBranch(id: CreatureId): CreatureBranch {
  if (id.includes('A') || id === 'childA') return 'A'
  if (id.includes('B') || id === 'childB') return 'B'
  if (id.includes('C') || id === 'childC') return 'C'
  return 'none'
}

export const BRANCH_COLORS: Record<CreatureBranch, string> = {
  A:    '#e8e8ff',
  B:    '#9b59b6',
  C:    '#3498db',
  none: '#9ca3af',
}

export const BRANCH_BG_COLORS: Record<CreatureBranch, string> = {
  A:    'rgba(255, 215, 0, 0.15)',
  B:    'rgba(155, 89, 182, 0.15)',
  C:    'rgba(52, 152, 219, 0.15)',
  none: 'rgba(156, 163, 175, 0.15)',
}

export const BRANCH_NAMES: Record<CreatureBranch, string> = {
  A:    '善',
  B:    '悪',
  C:    '中間',
  none: '—',
}

export interface CreatureDefinition {
  id: CreatureId
  name: string
  stage: EvolutionStage
  evolvesTo: CreatureId[]
}

export const CREATURE_TREE: Record<CreatureId, CreatureDefinition> = {
  egg:       { id: 'egg',       name: 'タマゴ',     stage: 0, evolvesTo: ['baby'] },
  baby:      { id: 'baby',      name: 'プティ',     stage: 1, evolvesTo: ['childA', 'childB', 'childC'] },
  childA:    { id: 'childA',    name: 'ルーチェ',   stage: 2, evolvesTo: ['adultA1', 'adultA2'] },
  childB:    { id: 'childB',    name: 'モルテ',     stage: 2, evolvesTo: ['adultB1', 'adultB2'] },
  childC:    { id: 'childC',    name: 'ゼファ',     stage: 2, evolvesTo: ['adultC1', 'adultC2'] },
  adultA1:   { id: 'adultA1',   name: 'セラフィア', stage: 3, evolvesTo: ['perfectA1'] },
  adultA2:   { id: 'adultA2',   name: 'エリアル',   stage: 3, evolvesTo: ['perfectA2'] },
  adultB1:   { id: 'adultB1',   name: 'グリマス',   stage: 3, evolvesTo: ['perfectB1'] },
  adultB2:   { id: 'adultB2',   name: 'ヴェノス',   stage: 3, evolvesTo: ['perfectB2'] },
  adultC1:   { id: 'adultC1',   name: 'ヴォルト',   stage: 3, evolvesTo: ['perfectC1'] },
  adultC2:   { id: 'adultC2',   name: 'ブレイン',   stage: 3, evolvesTo: ['perfectC2'] },
  perfectA1: { id: 'perfectA1', name: 'アルデア',   stage: 4, evolvesTo: ['ultimateA'] },
  perfectA2: { id: 'perfectA2', name: 'ヴェルタ',   stage: 4, evolvesTo: [] },
  perfectB1: { id: 'perfectB1', name: 'アビシア',   stage: 4, evolvesTo: ['ultimateB'] },
  perfectB2: { id: 'perfectB2', name: 'ソルヴァン', stage: 4, evolvesTo: [] },
  perfectC1: { id: 'perfectC1', name: 'アイギス',   stage: 4, evolvesTo: ['ultimateC'] },
  perfectC2: { id: 'perfectC2', name: 'ネクサス',   stage: 4, evolvesTo: [] },
  ultimateA: { id: 'ultimateA', name: 'エンピレア', stage: 5, evolvesTo: [] },
  ultimateB: { id: 'ultimateB', name: 'カオティア', stage: 5, evolvesTo: [] },
  ultimateC: { id: 'ultimateC', name: 'エクリプス', stage: 5, evolvesTo: [] },
}

export const STAGE_NAMES: Record<EvolutionStage, string> = {
  0: 'タマゴ',
  1: 'ベイビー',
  2: 'チャイルド',
  3: 'アダルト',
  4: 'パーフェクト',
  5: 'アルティメット',
}

export interface EvolutionRequirement {
  minAge: number
  minHappiness?: number
  minLevel?: number
  minCombatStats?: number // atk+def+spd
  minEachStat?: number    // each of atk,def,spd
}

export const EVOLUTION_REQUIREMENTS: Record<number, EvolutionRequirement> = {
  0: { minAge: 0 },                                              // Egg -> Baby (即時)
  1: { minAge: 1 },                                              // Baby -> Child (1時間)
  2: { minAge: 3, minHappiness: 50 },                           // Child -> Adult (3時間, 幸福50以上)
  3: { minAge: 6, minLevel: 8, minCombatStats: 40 },            // Adult -> Perfect (6時間, Lv8, 戦闘力40)
  4: { minAge: 12, minLevel: 14, minEachStat: 20 },             // Perfect1 -> Ultimate (12時間, Lv14, 各ステ20)
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

// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBars from '../StatusBars'
import type { Creature } from '../../types/creature'

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
    name: 'テストモン',
    type: 'Fire',
    evolutionStage: 1,
    level: 1,
    exp: 0,
    hp: 100,
    maxHp: 100,
    atk: 10,
    def: 10,
    spd: 10,
    hunger: 80,
    happiness: 70,
    age: 1,
    weight: 10,
    isSleeping: false,
    isAlive: true,
    lastUpdated: 0,
    evolutionName: 'ホノカ',
    totalDeaths: 0,
    trainCount: 0,
    playCount: 0,
    feedCount: 0,
    ...overrides,
  }
}

describe('StatusBars', () => {
  it('HP/空腹/幸福の各ラベルが表示される', () => {
    render(<StatusBars creature={makeCreature()} typeColor="#ff6b35" />)

    expect(screen.getByText(/HP/)).toBeInTheDocument()
    expect(screen.getByText(/空腹/)).toBeInTheDocument()
    expect(screen.getByText(/幸福/)).toBeInTheDocument()
  })

  it('Math.floor(hp)/maxHp の数値が表示される（hp=75, maxHp=100 → "75/100"）', () => {
    render(<StatusBars creature={makeCreature({ hp: 75, maxHp: 100 })} typeColor="#ff6b35" />)
    expect(screen.getByText('75/100')).toBeInTheDocument()
  })

  it('hunger=50 → "50/100" が表示される', () => {
    render(<StatusBars creature={makeCreature({ hunger: 50 })} typeColor="#ff6b35" />)
    expect(screen.getByText('50/100')).toBeInTheDocument()
  })

  it('happiness=70 → "70/100" が表示される', () => {
    render(<StatusBars creature={makeCreature({ happiness: 70 })} typeColor="#ff6b35" />)
    expect(screen.getByText('70/100')).toBeInTheDocument()
  })

  it('hp=100, maxHp=100 → バーのパーセントは 100%（isLow=false）で通常グラデーション', () => {
    const { container } = render(
      <StatusBars creature={makeCreature({ hp: 100, maxHp: 100 })} typeColor="#ff6b35" />
    )

    // HP バー（最初の bar-fill 要素）
    const barFills = container.querySelectorAll('.bar-fill')
    const hpBarFill = barFills[0] as HTMLElement
    expect(hpBarFill.style.width).toBe('100%')
    // isLow=false のとき red/orange グラデーションは含まれない
    expect(hpBarFill.style.background).not.toContain('#ef4444')
  })

  it('hp=24, maxHp=100 → pct=24 < 25 → isLow=true（赤グラデーションが style に含まれる）', () => {
    const { container } = render(
      <StatusBars creature={makeCreature({ hp: 24, maxHp: 100 })} typeColor="#ff6b35" />
    )

    const barFills = container.querySelectorAll('.bar-fill')
    const hpBarFill = barFills[0] as HTMLElement
    expect(hpBarFill.style.background).toContain('#ef4444')
  })

  it('hp=25, maxHp=100 → pct=25 → isLow=false（通常グラデーション）', () => {
    const { container } = render(
      <StatusBars creature={makeCreature({ hp: 25, maxHp: 100 })} typeColor="#ff6b35" />
    )

    const barFills = container.querySelectorAll('.bar-fill')
    const hpBarFill = barFills[0] as HTMLElement
    expect(hpBarFill.style.background).not.toContain('#ef4444')
  })

  it('hunger=0 → pct=0 < 25 → isLow=true（空腹バーが赤グラデーション）', () => {
    const { container } = render(
      <StatusBars creature={makeCreature({ hunger: 0 })} typeColor="#ff6b35" />
    )

    const barFills = container.querySelectorAll('.bar-fill')
    // hunger バーは 2 番目
    const hungerBarFill = barFills[1] as HTMLElement
    expect(hungerBarFill.style.background).toContain('#ef4444')
  })

  it('Math.floor が適用される（hp=99.9 → 表示は "99/100"）', () => {
    render(<StatusBars creature={makeCreature({ hp: 99.9, maxHp: 100 })} typeColor="#ff6b35" />)
    expect(screen.getByText('99/100')).toBeInTheDocument()
  })
})

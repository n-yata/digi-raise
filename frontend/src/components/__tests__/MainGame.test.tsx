// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MainGame from '../MainGame'
import type { Creature } from '../../types/creature'

vi.mock('../CreatureSprite', () => ({
  default: () => <div data-testid="creature-sprite" />,
}))

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-1',
    name: 'テストモン',
    type: 'Fire',
    evolutionStage: 1,
    level: 5,
    exp: 30,
    hp: 80,
    maxHp: 100,
    atk: 15,
    def: 12,
    spd: 10,
    hunger: 70,
    happiness: 60,
    age: 3,
    weight: 11,
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

const defaultProps = {
  creature: makeCreature(),
  devMode: false,
  attackAnimation: false,
  message: null,
  pendingEvolution: false,
  onFeed: vi.fn(),
  onTrain: vi.fn(),
  onPlay: vi.fn(),
  onSleep: vi.fn(),
  onEvolve: vi.fn(),
  onStatus: vi.fn(),
  onToggleDevMode: vi.fn(),
  onBattle: vi.fn(),
}

describe('MainGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creature.name がヘッダーに表示される', () => {
    render(<MainGame {...defaultProps} creature={makeCreature({ name: 'フレイモン' })} />)
    expect(screen.getByText('フレイモン')).toBeInTheDocument()
  })

  it('creature.evolutionName が表示される', () => {
    render(<MainGame {...defaultProps} creature={makeCreature({ evolutionName: 'バーニモン' })} />)
    expect(screen.getByText(/バーニモン/)).toBeInTheDocument()
  })

  it('creature.type.toUpperCase() のタイプバッジが表示される', () => {
    render(<MainGame {...defaultProps} creature={makeCreature({ type: 'Water' })} />)
    expect(screen.getByText('WATER')).toBeInTheDocument()
  })

  it('creature.isSleeping=true のとき「おやすみ中」バッジが表示される', () => {
    render(<MainGame {...defaultProps} creature={makeCreature({ isSleeping: true })} />)
    expect(screen.getByText(/おやすみ中/)).toBeInTheDocument()
  })

  it('creature.isSleeping=false のとき「おやすみ中」バッジが表示されない', () => {
    render(<MainGame {...defaultProps} creature={makeCreature({ isSleeping: false })} />)
    expect(screen.queryByText(/おやすみ中/)).not.toBeInTheDocument()
  })

  it('devMode=true のとき「⚡ 開発モード」バッジが表示される', () => {
    render(<MainGame {...defaultProps} devMode={true} />)
    expect(screen.getByText(/⚡ 開発モード/)).toBeInTheDocument()
  })

  it('devMode=true のとき DEV ボタンのテキストが「⚡DEV」になる', () => {
    render(<MainGame {...defaultProps} devMode={true} />)
    expect(screen.getByText('⚡DEV')).toBeInTheDocument()
  })

  it('message が non-null のとき、そのテキストが画面に表示される', () => {
    render(<MainGame {...defaultProps} message="おなかがすいた！" />)
    expect(screen.getByText('おなかがすいた！')).toBeInTheDocument()
  })

  it('message=null のとき、メッセージポップアップが表示されない', () => {
    render(<MainGame {...defaultProps} message={null} />)
    expect(screen.queryByText('おなかがすいた！')).not.toBeInTheDocument()
  })

  it('LV/ATK/DEF/SPD/体重 の統計値が表示される', () => {
    const creature = makeCreature({ level: 5, atk: 15, def: 12, spd: 10, weight: 11 })
    render(<MainGame {...defaultProps} creature={creature} />)

    expect(screen.getByText('LV')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('DEF')).toBeInTheDocument()
    expect(screen.getByText('SPD')).toBeInTheDocument()
    expect(screen.getByText('体重')).toBeInTheDocument()

    // 各値が表示される（getByText は完全一致なので値をそれぞれ検証）
    const allText = screen.getAllByText('5')
    expect(allText.length).toBeGreaterThan(0) // LV=5
    expect(screen.getByText('15')).toBeInTheDocument() // ATK
    expect(screen.getByText('12')).toBeInTheDocument() // DEF
    expect(screen.getByText('10')).toBeInTheDocument() // SPD
    expect(screen.getByText('11')).toBeInTheDocument() // 体重
  })

  it('「DEV」ボタンをクリックすると onToggleDevMode が呼ばれる', () => {
    const onToggleDevMode = vi.fn()
    render(<MainGame {...defaultProps} onToggleDevMode={onToggleDevMode} />)

    const devBtn = screen.getByText('DEV')
    fireEvent.click(devBtn)

    expect(onToggleDevMode).toHaveBeenCalledTimes(1)
  })

  describe('バトルボタン', () => {
    it('isSleeping=false, isAlive=true のとき enabled', () => {
      render(
        <MainGame
          {...defaultProps}
          creature={makeCreature({ isSleeping: false, isAlive: true })}
        />
      )
      const battleBtn = screen.getByText('バトル').closest('button')!
      expect(battleBtn).not.toBeDisabled()
    })

    it('isSleeping=true のとき disabled', () => {
      render(
        <MainGame
          {...defaultProps}
          creature={makeCreature({ isSleeping: true })}
        />
      )
      const battleBtn = screen.getByText('バトル').closest('button')!
      expect(battleBtn).toBeDisabled()
    })

    it('isAlive=false のとき disabled', () => {
      render(
        <MainGame
          {...defaultProps}
          creature={makeCreature({ isAlive: false, isSleeping: false })}
        />
      )
      const battleBtn = screen.getByText('バトル').closest('button')!
      expect(battleBtn).toBeDisabled()
    })

    it('バトルボタンをクリックすると onBattle が呼ばれる（enabled 時）', () => {
      const onBattle = vi.fn()
      render(
        <MainGame
          {...defaultProps}
          onBattle={onBattle}
          creature={makeCreature({ isSleeping: false, isAlive: true })}
        />
      )
      const battleBtn = screen.getByText('バトル').closest('button')!
      fireEvent.click(battleBtn)
      expect(onBattle).toHaveBeenCalledTimes(1)
    })
  })

  it('「ご飯」ボタンをクリックすると onFeed が呼ばれる', () => {
    const onFeed = vi.fn()
    render(
      <MainGame
        {...defaultProps}
        onFeed={onFeed}
        creature={makeCreature({ isSleeping: false, hunger: 50 })}
      />
    )
    const feedBtn = screen.getByText('ご飯').closest('button')!
    fireEvent.click(feedBtn)
    expect(onFeed).toHaveBeenCalledTimes(1)
  })

  it('「寝る」ボタンをクリックすると onSleep が呼ばれる', () => {
    const onSleep = vi.fn()
    render(
      <MainGame
        {...defaultProps}
        onSleep={onSleep}
        creature={makeCreature({ isSleeping: false })}
      />
    )
    // isSleeping=false のとき「寝る」と表示される
    const sleepBtn = screen.getByText('寝る').closest('button')!
    fireEvent.click(sleepBtn)
    expect(onSleep).toHaveBeenCalledTimes(1)
  })

  it('「ステータス」ボタンをクリックすると onStatus が呼ばれる', () => {
    const onStatus = vi.fn()
    render(<MainGame {...defaultProps} onStatus={onStatus} />)

    const statusBtn = screen.getByText('ステータス').closest('button')!
    fireEvent.click(statusBtn)
    expect(onStatus).toHaveBeenCalledTimes(1)
  })
})

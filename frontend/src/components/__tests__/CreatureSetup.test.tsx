// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreatureSetup from '../CreatureSetup'

const TYPE_DESCRIPTIONS: Record<string, string> = {
  Fire:    '炎の力！攻撃力が高い',
  Water:   '水の力！バランス型',
  Plant:   '自然の力！HP回復が得意',
  Thunder: '雷の力！スピードが速い',
  Dark:    '闇の力！神秘的な強さ',
  Light:   '光の力！幸福度維持が高い',
}

describe('CreatureSetup', () => {
  const onStart = vi.fn()
  const onBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- name ステップ ----

  it('name ステップで「← もどる」をクリックすると onBack が呼ばれる', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const backBtn = screen.getByText('← もどる')
    fireEvent.click(backBtn)

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('name ステップで「つぎへ →」ボタンは空名前のとき disabled になっている', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const nextBtn = screen.getByText('つぎへ →')
    expect(nextBtn).toBeDisabled()
  })

  it('name ステップで名前を入力して「つぎへ →」をクリックすると type ステップに遷移する', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'テストモン' } })

    const nextBtn = screen.getByText('つぎへ →')
    fireEvent.click(nextBtn)

    // type ステップでは 6 種類のタイプボタンが表示される
    expect(screen.getByText('Fire')).toBeInTheDocument()
    expect(screen.getByText('Water')).toBeInTheDocument()
  })

  it('name ステップで Enter キーを押すと type ステップに遷移する（名前入力済みの場合）', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'テストモン' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    expect(screen.getByText('Fire')).toBeInTheDocument()
  })

  it('name ステップで Enter キーを押しても空名前なら遷移しない', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const input = screen.getByPlaceholderText('なまえ...')
    // 名前は空のまま Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // name ステップのまま（つぎへ ボタンが存在し続ける）
    expect(screen.getByText('つぎへ →')).toBeInTheDocument()
    // Fire ボタンは表示されない
    expect(screen.queryByText('Fire')).not.toBeInTheDocument()
  })

  it('name ステップで {name.length}/12 が表示される（入力に応じて更新）', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    // 初期状態: 0/12 — テキストが分割される可能性があるため正規表現で検索
    expect(screen.getByText(/0\/12/)).toBeInTheDocument()

    // 3文字入力
    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(screen.getByText(/3\/12/)).toBeInTheDocument()
  })

  // ---- type ステップに移行するヘルパー（render は各テスト内で行う） ----

  function renderAndGoToTypeStep() {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'テストモン' } })
    fireEvent.click(screen.getByText('つぎへ →'))
  }

  it('type ステップで 6 種類のタイプボタンが表示される', () => {
    renderAndGoToTypeStep()

    const types = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']
    for (const type of types) {
      expect(screen.getByText(type)).toBeInTheDocument()
    }
  })

  it('type ステップで「← もどる」をクリックすると name ステップに戻る（onBack は呼ばれない）', () => {
    renderAndGoToTypeStep()

    const backBtn = screen.getByText('← もどる')
    fireEvent.click(backBtn)

    // name ステップに戻った確認（インプットが表示される）
    expect(screen.getByPlaceholderText('なまえ...')).toBeInTheDocument()
    // onBack は呼ばれない
    expect(onBack).not.toHaveBeenCalled()
  })

  it('type ステップでタイプを選択すると TYPE_DESCRIPTIONS が表示される', () => {
    renderAndGoToTypeStep()

    fireEvent.click(screen.getByText('Fire'))
    expect(screen.getByText(TYPE_DESCRIPTIONS.Fire)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Water'))
    expect(screen.getByText(TYPE_DESCRIPTIONS.Water)).toBeInTheDocument()
  })

  it('type ステップで「ゲームスタート！」は選択なしで disabled', () => {
    renderAndGoToTypeStep()

    const startBtn = screen.getByText('ゲームスタート！')
    expect(startBtn).toBeDisabled()
  })

  it('type ステップでタイプを選択して「ゲームスタート！」をクリックすると onStart が呼ばれる', () => {
    renderAndGoToTypeStep()

    fireEvent.click(screen.getByText('Fire'))
    const startBtn = screen.getByText('ゲームスタート！')
    expect(startBtn).not.toBeDisabled()
    fireEvent.click(startBtn)

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('onStart に渡されるクリーチャーの name と type が入力値と一致する', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)

    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'フレイモン' } })
    fireEvent.click(screen.getByText('つぎへ →'))

    fireEvent.click(screen.getByText('Thunder'))
    fireEvent.click(screen.getByText('ゲームスタート！'))

    expect(onStart).toHaveBeenCalledTimes(1)
    const creature = onStart.mock.calls[0][0]
    expect(creature.name).toBe('フレイモン')
    expect(creature.type).toBe('Thunder')
  })
})

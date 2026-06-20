// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreatureSetup from '../CreatureSetup'

describe('CreatureSetup', () => {
  const onStart = vi.fn()
  const onBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('「< もどる」をクリックすると onBack が呼ばれる', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    fireEvent.click(screen.getByText('< もどる'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('「ゲームスタート！」は空名前のとき disabled になっている', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    expect(screen.getByText('ゲームスタート！')).toBeDisabled()
  })

  it('タイプ選択UIは表示されない（属性選択は廃止）', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    for (const type of ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light']) {
      expect(screen.queryByText(type)).not.toBeInTheDocument()
    }
  })

  it('{name.length}/12 が入力に応じて更新される', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    expect(screen.getByText(/0\/12/)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('なまえ...'), { target: { value: 'abc' } })
    expect(screen.getByText(/3\/12/)).toBeInTheDocument()
  })

  it('名前を入力して「ゲームスタート！」で onStart が呼ばれ、creatureId は egg で生成される', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    fireEvent.change(screen.getByPlaceholderText('なまえ...'), { target: { value: 'マイモン' } })

    const startBtn = screen.getByText('ゲームスタート！')
    expect(startBtn).not.toBeDisabled()
    fireEvent.click(startBtn)

    expect(onStart).toHaveBeenCalledTimes(1)
    const creature = onStart.mock.calls[0][0]
    expect(creature.name).toBe('マイモン')
    expect(creature.creatureId).toBe('egg')
  })

  it('Enter キーでもゲームを開始できる（名前入力済みの場合）', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    const input = screen.getByPlaceholderText('なまえ...')
    fireEvent.change(input, { target: { value: 'テストモン' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('空名前のまま Enter を押しても開始しない', () => {
    render(<CreatureSetup onStart={onStart} onBack={onBack} />)
    fireEvent.keyDown(screen.getByPlaceholderText('なまえ...'), { key: 'Enter', code: 'Enter' })
    expect(onStart).not.toHaveBeenCalled()
  })
})

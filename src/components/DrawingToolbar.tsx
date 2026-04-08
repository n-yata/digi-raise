import type { DrawingTool } from './DrawingCanvas'
import { TYPE_COLORS } from '../data/evolutions'

interface DrawingToolbarProps {
  tool: DrawingTool
  color: string
  strokeWidth: number
  onToolChange: (tool: DrawingTool) => void
  onColorChange: (color: string) => void
  onStrokeWidthChange: (size: number) => void
  onUndo: () => void
}

const TYPE_COLOR_VALUES = Object.values(TYPE_COLORS)

const BASIC_COLORS = [
  '#ffffff', // white
  '#000000', // black
  '#e53935', // red
  '#43a047', // green
  '#1e88e5', // blue
  '#fdd835', // yellow
  '#fb8c00', // orange
  '#8e24aa', // purple
]

const PRESET_COLORS = [...TYPE_COLOR_VALUES, ...BASIC_COLORS]

const STROKE_SIZES: { label: string; value: number }[] = [
  { label: '細', value: 1 },
  { label: '中', value: 2 },
  { label: '太', value: 4 },
]

const TOOLS: { id: DrawingTool; label: string; emoji: string }[] = [
  { id: 'pen', label: 'ペン', emoji: '✏️' },
  { id: 'eraser', label: '消しゴム', emoji: '🧹' },
  { id: 'fill', label: '塗りつぶし', emoji: '🪣' },
]

export default function DrawingToolbar({
  tool,
  color,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
}: DrawingToolbarProps) {
  return (
    <div
      className="flex flex-col gap-3 p-3 rounded-xl"
      style={{
        background: '#16213e',
        border: '1px solid #0f3460',
        minWidth: 64,
      }}
    >
      {/* Tool selection */}
      <div className="flex flex-col gap-1">
        <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#64748b' }}>ツール</span>
        <div className="flex flex-col gap-1">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              title={t.label}
              className="flex items-center gap-1 px-2 py-1 rounded transition-all active:scale-95"
              style={{
                fontSize: '0.7rem',
                background: tool === t.id ? '#0f3460' : 'transparent',
                border: `1px solid ${tool === t.id ? '#4fc3f7' : '#334155'}`,
                color: tool === t.id ? '#4fc3f7' : '#94a3b8',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{t.emoji}</span>
              <span className="font-pixel" style={{ fontSize: '0.6rem' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div className="flex flex-col gap-1">
        <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#64748b' }}>サイズ</span>
        <div className="flex gap-1">
          {STROKE_SIZES.map(s => (
            <button
              key={s.value}
              onClick={() => onStrokeWidthChange(s.value)}
              title={s.label}
              className="flex-1 py-1 rounded font-pixel transition-all active:scale-95"
              style={{
                fontSize: '0.6rem',
                background: strokeWidth === s.value ? '#0f3460' : 'transparent',
                border: `1px solid ${strokeWidth === s.value ? '#4fc3f7' : '#334155'}`,
                color: strokeWidth === s.value ? '#4fc3f7' : '#94a3b8',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-col gap-1">
        <span className="font-pixel" style={{ fontSize: '0.55rem', color: '#64748b' }}>色</span>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              title={c}
              className="rounded transition-all active:scale-95"
              style={{
                width: 20,
                height: 20,
                background: c,
                border: color === c ? '2px solid #4fc3f7' : '1px solid #334155',
                boxShadow: color === c ? `0 0 6px ${c}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Current color display */}
        <div className="flex items-center gap-2 mt-1">
          <div
            className="rounded"
            style={{
              width: 20,
              height: 20,
              background: color,
              border: '1px solid #334155',
            }}
          />
          <input
            type="color"
            value={color}
            onChange={e => onColorChange(e.target.value)}
            className="rounded"
            style={{
              width: 28,
              height: 20,
              padding: 0,
              border: '1px solid #334155',
              background: 'transparent',
              cursor: 'pointer',
            }}
            title="カスタムカラー"
          />
        </div>
      </div>

      {/* Undo button */}
      <button
        onClick={onUndo}
        className="w-full py-1.5 rounded font-pixel transition-all active:scale-95 hover:brightness-125"
        style={{
          fontSize: '0.65rem',
          background: '#0f3460',
          border: '1px solid #1a4a8a',
          color: '#94a3b8',
        }}
      >
        ↩ もどす
      </button>
    </div>
  )
}

import { useState, useCallback, useRef } from 'react'
import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS, STAGE_NAMES } from '../data/evolutions'
import DrawingCanvas from './DrawingCanvas'
import DrawingToolbar from './DrawingToolbar'
import type { DrawingTool } from './DrawingCanvas'

interface CreatureDrawingScreenProps {
  creatureType: CreatureType
  onComplete: (sprites: Partial<Record<EvolutionStage, string>>) => void
  onSkip: () => void
}

// Drawing stages: 1-5 (excluding egg stage 0)
const DRAWING_STAGES: EvolutionStage[] = [1, 2, 3, 4, 5]

export default function CreatureDrawingScreen({
  creatureType,
  onComplete,
  onSkip,
}: CreatureDrawingScreenProps) {
  const color = TYPE_COLORS[creatureType]

  const [activeStage, setActiveStage] = useState<EvolutionStage>(1)
  const [sprites, setSprites] = useState<Partial<Record<EvolutionStage, string>>>({})

  // Tool state
  const [tool, setTool] = useState<DrawingTool>('pen')
  const [drawColor, setDrawColor] = useState(color)
  const [strokeWidth, setStrokeWidth] = useState(2)

  // Track canvas values per stage
  const [canvasValues, setCanvasValues] = useState<Partial<Record<EvolutionStage, string>>>({})

  // Undo channel via custom event
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleUndo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('drawing-undo', { detail: 'undo' }))
  }, [])

  const handleCanvasChange = useCallback((stage: EvolutionStage, svgString: string) => {
    setCanvasValues(prev => ({ ...prev, [stage]: svgString }))
    setSprites(prev => ({ ...prev, [stage]: svgString }))
  }, [])

  const handleComplete = useCallback(() => {
    // Merge canvas values into sprites
    const finalSprites: Partial<Record<EvolutionStage, string>> = { ...sprites }
    for (const stage of DRAWING_STAGES) {
      if (canvasValues[stage]) {
        finalSprites[stage] = canvasValues[stage]
      }
    }
    onComplete(finalSprites)
  }, [sprites, canvasValues, onComplete])

  const drawnCount = DRAWING_STAGES.filter(s => canvasValues[s] && canvasValues[s] !== '').length

  return (
    <div
      className="min-h-screen flex flex-col scanlines"
      style={{ background: '#1a1a2e', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${color}33` }}
      >
        <div className="font-pixel text-center mb-1" style={{ fontSize: '0.7rem', color }}>
          クリーチャーを描こう！
        </div>
        <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b' }}>
          ステージ1〜5の姿を描いてください
        </div>
        <div className="flex justify-center mt-2">
          <span
            className="font-pixel px-2 py-0.5 rounded-full"
            style={{ fontSize: '0.4rem', background: `${color}22`, color, border: `1px solid ${color}44` }}
          >
            {creatureType.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stage tabs */}
      <div
        className="flex px-2 pt-2 gap-1"
        style={{ borderBottom: `1px solid #0f3460` }}
      >
        {DRAWING_STAGES.map(stage => {
          const hasDrawing = !!(canvasValues[stage])
          const isActive = activeStage === stage
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className="flex-1 py-1.5 rounded-t font-pixel transition-all"
              style={{
                fontSize: '0.38rem',
                background: isActive ? '#0f3460' : 'transparent',
                border: `1px solid ${isActive ? color : '#334155'}`,
                borderBottom: isActive ? `1px solid #0f3460` : `1px solid #334155`,
                color: isActive ? color : hasDrawing ? '#4ade80' : '#64748b',
                position: 'relative',
              }}
            >
              {STAGE_NAMES[stage]}
              {hasDrawing && !isActive && (
                <span
                  className="absolute"
                  style={{ top: 2, right: 3, width: 4, height: 4, borderRadius: '50%', background: '#4ade80' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Drawing area */}
      <div className="flex-1 flex flex-col items-center py-4 px-2">
        {/* Stage label */}
        <div className="font-pixel mb-3" style={{ fontSize: '0.55rem', color }}>
          ステージ {activeStage} — {STAGE_NAMES[activeStage]}
        </div>

        {/* Canvas + toolbar row */}
        <div className="flex gap-3 items-start" ref={canvasRef}>
          {/* DrawingCanvas per stage (render all, hide inactive to preserve state) */}
          <div className="relative">
            {DRAWING_STAGES.map(stage => (
              <div
                key={stage}
                style={{ display: activeStage === stage ? 'block' : 'none' }}
              >
                <DrawingCanvas
                  value={canvasValues[stage]}
                  onChange={(svg) => handleCanvasChange(stage, svg)}
                  tool={tool}
                  color={drawColor}
                  strokeWidth={strokeWidth}
                />
              </div>
            ))}
          </div>

          <DrawingToolbar
            tool={tool}
            color={drawColor}
            strokeWidth={strokeWidth}
            onToolChange={setTool}
            onColorChange={setDrawColor}
            onStrokeWidthChange={setStrokeWidth}
            onUndo={handleUndo}
          />
        </div>

        {/* Progress indicator */}
        <div className="mt-3 font-pixel" style={{ fontSize: '0.4rem', color: '#64748b' }}>
          {drawnCount} / {DRAWING_STAGES.length} 枚描画済み
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-4 pb-6 flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-125"
          style={{
            fontSize: '0.55rem',
            background: '#16213e',
            border: '1px solid #334155',
            color: '#64748b',
          }}
        >
          スキップ
        </button>

        <button
          onClick={handleComplete}
          className="flex-1 py-3 rounded-xl font-pixel transition-all active:scale-95 hover:brightness-125"
          style={{
            fontSize: '0.55rem',
            background: `linear-gradient(135deg, ${color}44, ${color}22)`,
            border: `2px solid ${color}`,
            color: '#ffd700',
            boxShadow: `0 0 15px ${color}44`,
          }}
        >
          完成！
        </button>
      </div>
    </div>
  )
}

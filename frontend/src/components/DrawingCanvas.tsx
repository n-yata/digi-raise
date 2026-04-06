import { useRef, useState, useCallback, useEffect } from 'react'
import { applyFloodFill } from '../utils/floodFill'

export type DrawingTool = 'pen' | 'eraser' | 'fill'

interface DrawingCanvasProps {
  value?: string
  onChange: (svg: string) => void
  tool: DrawingTool
  color: string
  strokeWidth: number
}

interface PathData {
  id: string
  d: string
  stroke: string
  strokeWidth: number
  fill: string
  type: 'path' | 'fill-group'
  fillContent?: string // raw SVG content for fill groups
}

const CANVAS_SIZE = 64
const DISPLAY_SIZE = 256 // rendered pixel size

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function buildSvgString(paths: PathData[]): string {
  const inner = paths.map(p => {
    if (p.type === 'fill-group') {
      return p.fillContent ?? ''
    }
    return `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill}" stroke-linecap="round" stroke-linejoin="round"/>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">\n${inner}\n</svg>`
}

function parseSvgToPaths(svgString: string): PathData[] {
  // Simple parse: extract path elements
  const paths: PathData[] = []
  const pathRegex = /<path([^/]*)\/?>/g
  let match
  while ((match = pathRegex.exec(svgString)) !== null) {
    const attrs = match[1]
    const d = (attrs.match(/d="([^"]*)"/) || [])[1] ?? ''
    const stroke = (attrs.match(/stroke="([^"]*)"/) || [])[1] ?? '#000000'
    const strokeWidthStr = (attrs.match(/stroke-width="([^"]*)"/) || [])[1] ?? '2'
    const fill = (attrs.match(/fill="([^"]*)"/) || [])[1] ?? 'none'
    paths.push({
      id: generateId(),
      d,
      stroke,
      strokeWidth: parseFloat(strokeWidthStr),
      fill,
      type: 'path',
    })
  }
  return paths
}

export default function DrawingCanvas({
  value,
  onChange,
  tool,
  color,
  strokeWidth,
}: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<PathData[]>(() => {
    if (value) return parseSvgToPaths(value)
    return []
  })
  const [currentPoints, setCurrentPoints] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [, setUndoStack] = useState<PathData[][]>([])
  const [isFilling, setIsFilling] = useState(false)

  // Sync external value changes (when switching tabs)
  useEffect(() => {
    if (value) {
      const parsed = parseSvgToPaths(value)
      setPaths(parsed)
    } else {
      setPaths([])
    }
    setCurrentPoints('')
    setIsDrawing(false)
  }, [value])

  const getSvgPoint = useCallback((e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    return {
      x: Math.max(0, Math.min(CANVAS_SIZE, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(CANVAS_SIZE, (e.clientY - rect.top) * scaleY)),
    }
  }, [])

  const handlePointerDown = useCallback(async (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault()
    const { x, y } = getSvgPoint(e)

    if (tool === 'fill') {
      if (isFilling) return
      setIsFilling(true)
      const currentSvg = buildSvgString(paths)
      try {
        const newSvg = await applyFloodFill(currentSvg, x, y, color)
        // Extract fill group content and add as special path entry
        const fillMatch = newSvg.match(/<g class="fill-layer">([\s\S]*?)<\/g>/)
        if (fillMatch) {
          const newPaths: PathData[] = [
            ...paths,
            {
              id: generateId(),
              d: '',
              stroke: 'none',
              strokeWidth: 0,
              fill: color,
              type: 'fill-group',
              fillContent: `<g class="fill-layer">${fillMatch[1]}</g>`,
            },
          ]
          setUndoStack(prev => [...prev, paths])
          setPaths(newPaths)
          onChange(buildSvgString(newPaths))
        }
      } finally {
        setIsFilling(false)
      }
      return
    }

    setIsDrawing(true)
    setCurrentPoints(`M ${x.toFixed(1)} ${y.toFixed(1)}`)
    ;(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId)
  }, [tool, isFilling, paths, color, getSvgPoint, onChange])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getSvgPoint(e)
    setCurrentPoints(prev => prev + ` L ${x.toFixed(1)} ${y.toFixed(1)}`)
  }, [isDrawing, getSvgPoint])

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    if (!currentPoints) return

    const newPath: PathData = {
      id: generateId(),
      d: currentPoints,
      stroke: tool === 'eraser' ? '#1a1a2e' : color,
      strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
      fill: 'none',
      type: 'path',
    }

    setUndoStack(prev => [...prev, paths])
    const newPaths = [...paths, newPath]
    setPaths(newPaths)
    setCurrentPoints('')
    onChange(buildSvgString(newPaths))
  }, [isDrawing, currentPoints, tool, color, strokeWidth, paths, onChange])

  const handleUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const next = [...prev]
      const restored = next.pop()!
      setPaths(restored)
      onChange(buildSvgString(restored))
      return next
    })
  }, [onChange])

  // Expose undo via ref for external toolbar use
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'undo') handleUndo()
    }
    window.addEventListener('drawing-undo', handler)
    return () => window.removeEventListener('drawing-undo', handler)
  }, [handleUndo])

  const currentStrokeColor = tool === 'eraser' ? '#1a1a2e' : color
  const currentStrokeWidth = tool === 'eraser' ? strokeWidth * 2 : strokeWidth

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        width={DISPLAY_SIZE}
        height={DISPLAY_SIZE}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          background: '#1a1a2e',
          border: '2px solid #0f3460',
          borderRadius: 4,
          cursor: tool === 'fill' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'crosshair',
          touchAction: 'none',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      >
        {/* Rendered paths */}
        {paths.map(p => {
          if (p.type === 'fill-group' && p.fillContent) {
            return (
              <g key={p.id} dangerouslySetInnerHTML={{ __html: p.fillContent }} />
            )
          }
          return (
            <path
              key={p.id}
              d={p.d}
              stroke={p.stroke}
              strokeWidth={p.strokeWidth}
              fill={p.fill}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* Current stroke being drawn */}
        {isDrawing && currentPoints && (
          <path
            d={currentPoints}
            stroke={currentStrokeColor}
            strokeWidth={currentStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Fill loading overlay */}
      {isFilling && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'rgba(26,26,46,0.7)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#4fc3f7' }}>
            塗りつぶし中...
          </span>
        </div>
      )}
    </div>
  )
}

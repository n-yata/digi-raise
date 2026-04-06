/**
 * Flood fill utility for SVG drawing canvas.
 * Rasterizes SVG to offscreen canvas, performs flood fill,
 * then converts filled region back to SVG rect elements.
 */

interface Point {
  x: number
  y: number
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)
}

/**
 * Rasterizes SVG string to ImageData on a 64x64 canvas.
 */
async function rasterizeSvg(svgString: string, size: number): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    // Fill background white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, size, size))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Return blank white image data on error
      resolve(ctx.getImageData(0, 0, size, size))
    }
    img.src = url
  })
}

/**
 * Performs flood fill on ImageData starting at (startX, startY),
 * returns set of filled pixel coordinates.
 */
function floodFillPixels(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number
): Set<number> {
  const { width, height, data } = imageData
  const filled = new Set<number>()

  const idx = (x: number, y: number) => (y * width + x) * 4
  const startIdx = idx(startX, startY)
  const targetR = data[startIdx]
  const targetG = data[startIdx + 1]
  const targetB = data[startIdx + 2]

  const stack: Point[] = [{ x: startX, y: startY }]
  const visited = new Set<number>()
  visited.add(startY * width + startX)

  while (stack.length > 0) {
    const { x, y } = stack.pop()!
    const i = idx(x, y)
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (colorDistance(r, g, b, targetR, targetG, targetB) > tolerance) {
      continue
    }

    filled.add(y * width + x)

    const neighbors: Point[] = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ]

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue
      const key = n.y * width + n.x
      if (visited.has(key)) continue
      visited.add(key)
      stack.push(n)
    }
  }

  return filled
}

/**
 * Converts a set of filled pixel coordinates to SVG rect elements.
 * Uses run-length encoding per row to minimize rect count.
 */
function sanitizeColor(color: string): string {
  return /^#[0-9a-fA-F]{3,6}$/.test(color) ? color : '#000000'
}

function pixelsToSvgRects(filled: Set<number>, width: number, fillColor: string): string {
  fillColor = sanitizeColor(fillColor)
  const rows = new Map<number, number[]>()

  for (const key of filled) {
    const y = Math.floor(key / width)
    const x = key % width
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y)!.push(x)
  }

  const rects: string[] = []

  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b)
    let runStart = xs[0]
    let runEnd = xs[0]

    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === runEnd + 1) {
        runEnd = xs[i]
      } else {
        rects.push(`<rect x="${runStart}" y="${y}" width="${runEnd - runStart + 1}" height="1" fill="${fillColor}"/>`)
        runStart = xs[i]
        runEnd = xs[i]
      }
    }
    rects.push(`<rect x="${runStart}" y="${y}" width="${runEnd - runStart + 1}" height="1" fill="${fillColor}"/>`)
  }

  return rects.join('\n')
}

/**
 * Main flood fill function.
 * Takes current SVG string, fill point, fill color,
 * returns new SVG string with fill added.
 */
export async function applyFloodFill(
  svgString: string,
  fillX: number,
  fillY: number,
  fillColor: string,
  size: number = 64,
  tolerance: number = 30
): Promise<string> {
  const imageData = await rasterizeSvg(svgString, size)
  const pixelX = Math.floor(fillX)
  const pixelY = Math.floor(fillY)

  if (pixelX < 0 || pixelX >= size || pixelY < 0 || pixelY >= size) {
    return svgString
  }

  const filled = floodFillPixels(imageData, pixelX, pixelY, tolerance)

  if (filled.size === 0) return svgString

  const rectsSvg = pixelsToSvgRects(filled, size, fillColor)

  // Insert fill rects before the closing </svg> tag
  return svgString.replace('</svg>', `<g class="fill-layer">\n${rectsSvg}\n</g>\n</svg>`)
}

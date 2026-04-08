import pako from 'pako'

const BITMAP_SIZE = 48
const MAX_COMPRESSED_BYTES = 2000

/**
 * SVG文字列を48x48ビットマップに変換し、deflate圧縮してBase64エンコードした文字列を返す。
 * 圧縮後のサイズが MAX_COMPRESSED_BYTES を超える場合は null を返す。
 */
export async function compressSvgForQR(svgString: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = BITMAP_SIZE
        canvas.height = BITMAP_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        ctx.drawImage(img, 0, 0, BITMAP_SIZE, BITMAP_SIZE)
        const imageData = ctx.getImageData(0, 0, BITMAP_SIZE, BITMAP_SIZE)
        const rgba = imageData.data // Uint8ClampedArray, length = 48*48*4

        // 背景色 #1a1a2e を透明として扱い、アルファ0に変換（バイト節約）
        const BG_R = 0x1a, BG_G = 0x1a, BG_B = 0x2e
        const BG_THRESHOLD = 20

        const processed = new Uint8Array(rgba.length)
        for (let i = 0; i < rgba.length; i += 4) {
          const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2], a = rgba[i + 3]
          if (
            a > 0 &&
            Math.abs(r - BG_R) < BG_THRESHOLD &&
            Math.abs(g - BG_G) < BG_THRESHOLD &&
            Math.abs(b - BG_B) < BG_THRESHOLD
          ) {
            processed[i] = 0
            processed[i + 1] = 0
            processed[i + 2] = 0
            processed[i + 3] = 0
          } else {
            processed[i] = r
            processed[i + 1] = g
            processed[i + 2] = b
            processed[i + 3] = a
          }
        }

        const compressed = pako.deflate(processed, { level: 9 })

        if (compressed.length > MAX_COMPRESSED_BYTES) {
          resolve(null)
          return
        }

        // Uint8Array → Base64
        let binary = ''
        const len = compressed.length
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(compressed[i])
        }
        resolve(btoa(binary))
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * compressSvgForQR で生成した Base64 文字列を復元し、SVG文字列として返す。
 */
const MAX_INFLATED_BYTES = BITMAP_SIZE * BITMAP_SIZE * 4 * 2 // 48*48*4 = 9216, 余裕を持って2倍
const MAX_BASE64_LENGTH = 4000
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/

/**
 * compressSvgForQR で生成した Base64 文字列を復元し、PNG data URL を返す。
 * dangerouslySetInnerHTML ではなく <img> タグで安全に表示する。
 */
export function decompressSvgFromQR(compressed: string): string | null {
  try {
    // Base64 入力の事前検証
    if (!compressed || compressed.length > MAX_BASE64_LENGTH || !BASE64_RE.test(compressed)) {
      return null
    }

    const binary = atob(compressed)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const rgba = pako.inflate(bytes)

    // inflate爆弾対策: 展開後サイズの上限チェック
    if (rgba.length > MAX_INFLATED_BYTES) {
      return null
    }

    // ピクセルデータをCanvasに描画し、PNG data URL として取得
    const canvas = document.createElement('canvas')
    canvas.width = BITMAP_SIZE
    canvas.height = BITMAP_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = ctx.createImageData(BITMAP_SIZE, BITMAP_SIZE)
    imageData.data.set(rgba)
    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

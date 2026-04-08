const BITMAP_SIZE = 32
const MAX_BASE64_LENGTH = 2000

/**
 * SVG文字列を32x32のJPEGに変換し、Base64エンコードした文字列を返す。
 * Base64文字列が MAX_BASE64_LENGTH を超える場合は null を返す。
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

        // 背景色を塗ってからSVGを描画
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, BITMAP_SIZE, BITMAP_SIZE)
        ctx.drawImage(img, 0, 0, BITMAP_SIZE, BITMAP_SIZE)

        // JPEG低品質でサイズを削減
        const dataUrl = canvas.toDataURL('image/jpeg', 0.3)
        const base64 = dataUrl.split(',')[1]
        if (!base64 || base64.length > MAX_BASE64_LENGTH) {
          resolve(null)
          return
        }

        resolve(base64)
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = url
  })
}

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/

/**
 * compressSvgForQR で生成した Base64 文字列を JPEG data URL として返す。
 */
export function decompressSvgFromQR(compressed: string): string | null {
  if (!compressed || compressed.length > MAX_BASE64_LENGTH || !BASE64_RE.test(compressed)) {
    return null
  }

  return `data:image/jpeg;base64,${compressed}`
}

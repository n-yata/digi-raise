const BITMAP_SIZE = 48
const MAX_COMPRESSED_BYTES = 2500 // Base64化前のPNGバイト数上限
const MAX_BASE64_LENGTH = 4000

/**
 * SVG文字列を48x48のPNGに変換し、Base64エンコードした文字列を返す。
 * PNGサイズが MAX_COMPRESSED_BYTES を超える場合は null を返す。
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

        // 背景色を塗ってからSVGを描画（透明部分を背景色にする）
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, BITMAP_SIZE, BITMAP_SIZE)
        ctx.drawImage(img, 0, 0, BITMAP_SIZE, BITMAP_SIZE)

        // PNG data URLを取得
        const dataUrl = canvas.toDataURL('image/png')
        const base64 = dataUrl.split(',')[1]
        if (!base64) {
          resolve(null)
          return
        }

        // Base64からバイトサイズを概算チェック
        const byteSize = Math.floor(base64.length * 3 / 4)
        if (byteSize > MAX_COMPRESSED_BYTES) {
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
 * compressSvgForQR で生成した Base64 文字列（PNGバイナリ）を PNG data URL として返す。
 * <img> タグで安全に表示する。
 */
export function decompressSvgFromQR(compressed: string): string | null {
  // Base64 入力の事前検証
  if (!compressed || compressed.length > MAX_BASE64_LENGTH || !BASE64_RE.test(compressed)) {
    return null
  }

  return `data:image/png;base64,${compressed}`
}

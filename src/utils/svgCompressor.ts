const BITMAP_SIZE = 16
const MAX_BASE64_LENGTH = 500

/**
 * SVG文字列を16x16のRGB332形式（1バイト/ピクセル）に変換しBase64で返す。
 * 合計256バイト → Base64で344文字。QRコードに収まるサイズ。
 *
 * RGB332: RRRGGGBB (R:3bit, G:3bit, B:2bit = 256色)
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

        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, BITMAP_SIZE, BITMAP_SIZE)
        ctx.drawImage(img, 0, 0, BITMAP_SIZE, BITMAP_SIZE)

        const imageData = ctx.getImageData(0, 0, BITMAP_SIZE, BITMAP_SIZE)
        const rgba = imageData.data

        // RGBA → RGB332 (1 byte per pixel)
        const packed = new Uint8Array(BITMAP_SIZE * BITMAP_SIZE)
        for (let i = 0; i < packed.length; i++) {
          const r = rgba[i * 4]
          const g = rgba[i * 4 + 1]
          const b = rgba[i * 4 + 2]
          packed[i] = (r & 0xE0) | ((g >> 3) & 0x1C) | ((b >> 6) & 0x03)
        }

        // Uint8Array → Base64
        let binary = ''
        for (let i = 0; i < packed.length; i++) {
          binary += String.fromCharCode(packed[i])
        }
        const base64 = btoa(binary)

        if (base64.length > MAX_BASE64_LENGTH) {
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
 * RGB332形式のBase64文字列からPNG data URLに復元する。
 */
export function decompressSvgFromQR(compressed: string): string | null {
  if (!compressed || compressed.length > MAX_BASE64_LENGTH || !BASE64_RE.test(compressed)) {
    return null
  }

  try {
    const binary = atob(compressed)
    if (binary.length !== BITMAP_SIZE * BITMAP_SIZE) return null

    const canvas = document.createElement('canvas')
    canvas.width = BITMAP_SIZE
    canvas.height = BITMAP_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = ctx.createImageData(BITMAP_SIZE, BITMAP_SIZE)
    const rgba = imageData.data

    // RGB332 → RGBA
    for (let i = 0; i < binary.length; i++) {
      const byte = binary.charCodeAt(i)
      const r = byte & 0xE0             // 3bit → 上位3bit
      const g = (byte & 0x1C) << 3      // 3bit → 上位3bit
      const b = (byte & 0x03) << 6      // 2bit → 上位2bit
      rgba[i * 4] = r | (r >> 3) | (r >> 6)     // ビット拡張で滑らかに
      rgba[i * 4 + 1] = g | (g >> 3) | (g >> 6)
      rgba[i * 4 + 2] = b | (b >> 2) | (b >> 4) | (b >> 6)
      rgba[i * 4 + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

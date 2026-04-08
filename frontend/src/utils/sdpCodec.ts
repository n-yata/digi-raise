import pako from 'pako'

const MAX_ENCODED_SIZE = 5000   // Base64文字数の上限
const MAX_DECODED_SIZE = 50000  // 展開後の上限（バイト）

/**
 * SDP文字列をQRコード用に圧縮・エンコードする
 * SDP → 不要行除去 → pako deflate → Base64
 */
export function encodeSdp(sdp: string): string {
  const minified = minifySdp(sdp)
  const compressed = pako.deflate(new TextEncoder().encode(minified))
  return btoa(String.fromCharCode(...compressed))
}

/**
 * QRコードから読み取った文字列をSDPに復元する
 * Base64 → pako inflate → SDP復元
 * サイズ制限付きでzip bomb攻撃を防止
 */
export function decodeSdp(encoded: string): string {
  if (encoded.length > MAX_ENCODED_SIZE) {
    throw new Error('SDP data too large')
  }

  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const decompressed = pako.inflate(bytes)

  if (decompressed.length > MAX_DECODED_SIZE) {
    throw new Error('Decompressed SDP too large')
  }

  return new TextDecoder().decode(decompressed)
}

/**
 * SDPから不要な行を除去してサイズを削減する
 * DataChannel専用のため、音声・映像関連の行は不要
 */
function minifySdp(sdp: string): string {
  const lines = sdp.split('\r\n')
  const kept: string[] = []

  for (const line of lines) {
    // 空行はスキップ
    if (line === '') continue
    // 帯域制限行は不要
    if (line.startsWith('b=')) continue
    // extmap（RTP拡張）は不要
    if (line.startsWith('a=extmap')) continue
    // msid-semantic は不要
    if (line.startsWith('a=msid-semantic')) continue

    kept.push(line)
  }

  return kept.join('\r\n') + '\r\n'
}

/**
 * 圧縮後のサイズを取得（QRコードの容量チェック用）
 */
export function getEncodedSize(sdp: string): number {
  return encodeSdp(sdp).length
}

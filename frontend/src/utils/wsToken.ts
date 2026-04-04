/**
 * WebSocket接続トークン生成
 * HMAC-SHA256をWeb Crypto APIで実装
 */
export async function generateWsToken(): Promise<{ token: string; ts: number }> {
  const secret = import.meta.env.VITE_WS_SECRET_KEY ?? 'default-secret'
  const ts = Math.floor(Date.now() / 1000)
  const message = `ws-auth:${ts}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const hashArray = Array.from(new Uint8Array(signature))
  const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return { token, ts }
}

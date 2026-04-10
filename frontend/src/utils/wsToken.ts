// WebSocket 接続時の HMAC-SHA256 トークンを生成する
// フォーマット: "{timestamp}.{hmac_hex}"
// クライアントサイドにシークレットが露出する前提（ビルド時埋め込み）

const FALLBACK_SECRET = '<REDACTED_HMAC_SECRET>'

function getSecretKey(): string {
  return import.meta.env.VITE_WS_SECRET_KEY ?? FALLBACK_SECRET
}

export async function generateWsToken(): Promise<string> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const secret = getSecretKey()

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(timestamp)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hmacHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return `${timestamp}.${hmacHex}`
}

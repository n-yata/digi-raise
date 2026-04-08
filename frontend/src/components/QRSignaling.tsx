import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import type { UseWebRTCReturn } from '../hooks/useWebRTC'

type SignalingPhase =
  | 'choose_role'       // ホスト/ゲスト選択
  | 'host_show_offer'   // ホスト: QRコード表示中
  | 'host_scan_answer'  // ホスト: ゲストのQR読み取り中
  | 'guest_scan_offer'  // ゲスト: ホストのQR読み取り中
  | 'guest_show_answer' // ゲスト: QRコード表示中
  | 'connecting'        // 接続確立中
  | 'connected'         // 接続完了
  | 'error'             // エラー

interface QRSignalingProps {
  webrtc: UseWebRTCReturn
  onConnected: () => void
  onCancel: () => void
}

const CONNECTION_TIMEOUT = 15000

/** バイブレーションフィードバック（対応端末のみ） */
function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function QRSignaling({ webrtc, onConnected, onCancel }: QRSignalingProps) {
  const [phase, setPhase] = useState<SignalingPhase>('choose_role')
  const [qrData, setQrData] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [showClipboardInput, setShowClipboardInput] = useState(false)
  const [clipboardInput, setClipboardInput] = useState('')
  const [connectingElapsed, setConnectingElapsed] = useState(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanHandledRef = useRef(false)
  const connectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scannerContainerId = 'qr-scanner'

  // 接続完了を検知
  useEffect(() => {
    if (webrtc.connectionState === 'connected') {
      stopScanner()
      clearConnectionTimer()
      vibrate([100, 50, 100]) // 成功バイブレーション
      setPhase('connected')
      onConnected()
    } else if (webrtc.connectionState === 'failed') {
      stopScanner()
      clearConnectionTimer()
      vibrate(300) // エラーバイブレーション
      setError('接続に失敗しました。ネットワーク環境を確認してください。')
      setPhase('error')
    }
  }, [webrtc.connectionState, onConnected])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current
      scannerRef.current = null
      try {
        await scanner.stop()
      } catch { /* ignore */ }
      try {
        scanner.clear()
      } catch { /* ignore */ }
    }
  }, [])

  const clearConnectionTimer = useCallback(() => {
    if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current)
      connectionTimerRef.current = null
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    setConnectingElapsed(0)
  }, [])

  /** 接続中タイマーを開始 */
  const startConnectionTimer = useCallback(() => {
    setConnectingElapsed(0)

    connectionTimerRef.current = setInterval(() => {
      setConnectingElapsed(prev => prev + 1)
    }, 1000)

    connectionTimeoutRef.current = setTimeout(() => {
      clearConnectionTimer()
      vibrate(300)
      setError('接続がタイムアウトしました。相手のQRコードを正しく読み取れているか確認してください。')
      setPhase('error')
    }, CONNECTION_TIMEOUT)
  }, [clearConnectionTimer])

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopScanner()
      clearConnectionTimer()
    }
  }, [stopScanner, clearConnectionTimer])

  /** ホスト: Offer生成 → QR表示 */
  const startAsHost = async () => {
    try {
      const encoded = await webrtc.createOffer()
      setQrData(encoded)
      setPhase('host_show_offer')
    } catch {
      setError('Offerの生成に失敗しました')
      setPhase('error')
    }
  }

  /** ゲスト: カメラ起動してOffer読み取り */
  const startAsGuest = () => {
    setPhase('guest_scan_offer')
    setTimeout(() => startScanner(handleGuestScannedOffer), 100)
  }

  /** ゲスト: Offer読み取り後 → Answer生成 → QR表示 */
  const handleGuestScannedOffer = async (encodedOffer: string) => {
    await stopScanner()
    vibrate(100) // 読み取り成功フィードバック
    try {
      const encodedAnswer = await webrtc.acceptOffer(encodedOffer)
      setQrData(encodedAnswer)
      setPhase('guest_show_answer')
      // ゲスト側: ホストの読み取りを待つ間、接続タイマー開始
      startConnectionTimer()
    } catch {
      setError('Offerの読み取りに失敗しました。もう一度試してください。')
      setPhase('error')
    }
  }

  /** ホスト: QR表示後 → カメラ起動してAnswer読み取り */
  const hostStartScanAnswer = () => {
    setPhase('host_scan_answer')
    setTimeout(() => startScanner(handleHostScannedAnswer), 100)
  }

  /** ホスト: Answer読み取り → 接続確立 */
  const handleHostScannedAnswer = async (encodedAnswer: string) => {
    await stopScanner()
    vibrate(100) // 読み取り成功フィードバック
    setPhase('connecting')
    startConnectionTimer()
    try {
      await webrtc.acceptAnswer(encodedAnswer)
    } catch {
      clearConnectionTimer()
      setError('Answerの読み取りに失敗しました。もう一度試してください。')
      setPhase('error')
    }
  }

  /** QRスキャナー起動 */
  const startScanner = (onScan: (data: string) => void) => {
    const container = document.getElementById(scannerContainerId)
    if (!container) return

    scanHandledRef.current = false
    const scanner = new Html5Qrcode(scannerContainerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // 重複防止: 1回だけ処理する
        if (scanHandledRef.current) return
        scanHandledRef.current = true

        // html5-qrcodeのコールバック内からstop()を直接呼ぶとデッドロックするため
        // setTimeoutで次のフレームに遅延させる
        setTimeout(() => {
          onScan(decodedText)
        }, 0)
      },
      () => { /* ignore scan failures */ },
    ).catch(() => {
      setError('カメラにアクセスできません。カメラの権限を確認してください。')
      setPhase('error')
    })
  }

  /** クリップボードにコピー */
  const handleCopy = () => {
    navigator.clipboard.writeText(qrData).then(() => {
      setCopied(true)
      vibrate(50)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  /** クリップボードペーストで接続情報を入力 */
  const handleClipboardSubmit = () => {
    const data = clipboardInput.trim()
    if (!data) return

    if (phase === 'guest_scan_offer') {
      handleGuestScannedOffer(data)
    } else if (phase === 'host_scan_answer') {
      handleHostScannedAnswer(data)
    }
    setShowClipboardInput(false)
    setClipboardInput('')
  }

  const handleCancel = () => {
    stopScanner()
    clearConnectionTimer()
    webrtc.close()
    onCancel()
  }

  const handleRetry = () => {
    stopScanner()
    clearConnectionTimer()
    webrtc.close()
    setError('')
    setQrData('')
    setShowClipboardInput(false)
    setClipboardInput('')
    setPhase('choose_role')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 役割選択 */}
      {phase === 'choose_role' && (
        <>
          <div className="font-pixel text-center mb-2" style={{ fontSize: '0.5rem', color: '#e0e0e0' }}>
            P2P接続方法を選択
          </div>
          <button
            onClick={startAsHost}
            className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.5rem',
              background: 'linear-gradient(135deg, #4fc3f722, #4fc3f711)',
              border: '2px solid #4fc3f744',
              color: '#4fc3f7',
            }}
          >
            対戦を作成する（QRを表示）
          </button>
          <button
            onClick={startAsGuest}
            className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.5rem',
              background: 'linear-gradient(135deg, #ffd70022, #ffd70011)',
              border: '2px solid #ffd70044',
              color: '#ffd700',
            }}
          >
            QRを読み取って参加
          </button>
          <div className="font-pixel text-center mt-1" style={{ fontSize: '0.35rem', color: '#64748b' }}>
            近くにいる人と直接対戦できます（サーバー不要）
          </div>
        </>
      )}

      {/* ホスト: Offer QR表示 */}
      {phase === 'host_show_offer' && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b' }}>
            このQRコードを相手に読み取ってもらってください
          </div>
          <div className="p-3 rounded-lg" style={{ background: '#ffffff' }}>
            <QRCodeSVG
              value={qrData}
              size={220}
              level="L"
            />
          </div>
          <div className="font-pixel text-center" style={{ fontSize: '0.35rem', color: '#64748b' }}>
            データサイズ: {qrData.length} 文字
          </div>
          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.4rem',
              background: copied ? '#4ade8022' : '#16213e',
              border: `1px solid ${copied ? '#4ade80' : '#0f3460'}`,
              color: copied ? '#4ade80' : '#4fc3f7',
            }}
          >
            {copied ? 'コピー済！' : 'テキストをコピー（QRが読めない場合）'}
          </button>
          <button
            onClick={hostStartScanAnswer}
            className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
            style={{
              fontSize: '0.5rem',
              background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
              backgroundSize: '200% 100%',
              border: '2px solid #ffd700',
              color: '#111',
              boxShadow: '0 0 20px #ffd70088',
            }}
          >
            相手が読み取ったら次へ
          </button>
        </div>
      )}

      {/* ゲスト: Answer QR表示 */}
      {phase === 'guest_show_answer' && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b' }}>
            このQRコードをホストに読み取ってもらってください
          </div>
          <div className="p-3 rounded-lg" style={{ background: '#ffffff' }}>
            <QRCodeSVG
              value={qrData}
              size={220}
              level="L"
            />
          </div>
          <div className="font-pixel text-center" style={{ fontSize: '0.35rem', color: '#64748b' }}>
            データサイズ: {qrData.length} 文字
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.4rem',
              background: copied ? '#4ade8022' : '#16213e',
              border: `1px solid ${copied ? '#4ade80' : '#0f3460'}`,
              color: copied ? '#4ade80' : '#4fc3f7',
            }}
          >
            {copied ? 'コピー済！' : 'テキストをコピー（QRが読めない場合）'}
          </button>
          <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#ffd700' }}>
            <div className="animate-pulse">ホストの読み取りを待っています...</div>
            {connectingElapsed > 0 && (
              <div className="mt-1" style={{ fontSize: '0.35rem', color: '#64748b' }}>
                経過: {connectingElapsed}秒
              </div>
            )}
          </div>
        </div>
      )}

      {/* QRスキャナー */}
      {(phase === 'host_scan_answer' || phase === 'guest_scan_offer') && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-pixel text-center" style={{ fontSize: '0.45rem', color: '#64748b' }}>
            {phase === 'guest_scan_offer'
              ? 'ホストのQRコードを読み取ってください'
              : '相手のQRコードを読み取ってください'}
          </div>
          <div
            id={scannerContainerId}
            className="rounded-lg overflow-hidden"
            style={{ width: 280, minHeight: 280, background: '#000' }}
          />
          {/* クリップボード入力フォールバック */}
          {!showClipboardInput ? (
            <button
              onClick={() => setShowClipboardInput(true)}
              className="font-pixel transition-all"
              style={{ fontSize: '0.4rem', color: '#64748b', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
            >
              QRが読めない場合はテキストで入力
            </button>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <textarea
                value={clipboardInput}
                onChange={(e) => setClipboardInput(e.target.value)}
                placeholder="相手からコピーしたテキストをペースト"
                className="w-full px-3 py-2 rounded-lg font-pixel"
                rows={3}
                style={{
                  fontSize: '0.4rem',
                  background: '#16213e',
                  border: '1px solid #0f3460',
                  color: '#e0e0e0',
                  outline: 'none',
                  resize: 'none',
                }}
              />
              <button
                onClick={handleClipboardSubmit}
                disabled={!clipboardInput.trim()}
                className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95"
                style={{
                  fontSize: '0.45rem',
                  background: clipboardInput.trim() ? '#4fc3f722' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${clipboardInput.trim() ? '#4fc3f744' : 'rgba(255,255,255,0.1)'}`,
                  color: clipboardInput.trim() ? '#4fc3f7' : '#64748b',
                }}
              >
                接続情報を送信
              </button>
            </div>
          )}
        </div>
      )}

      {/* 接続確立中 */}
      {phase === 'connecting' && (
        <div className="flex flex-col items-center gap-3 py-6">
          {/* プログレスインジケーター */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: '#4fc3f7',
                  opacity: 0.3,
                  animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }
          `}</style>

          <div className="font-pixel text-center" style={{ fontSize: '0.5rem', color: '#ffd700' }}>
            P2P接続を確立中...
          </div>

          {/* 接続ステップ表示 */}
          <div className="flex flex-col gap-1.5 w-full px-4">
            <StepIndicator label="QRコード交換" done />
            <StepIndicator label="STUN経由でNAT越え" done={connectingElapsed >= 2} active={connectingElapsed < 2} />
            <StepIndicator label="P2P接続確立" active={connectingElapsed >= 2} />
          </div>

          <div className="font-pixel text-center mt-2" style={{ fontSize: '0.35rem', color: '#64748b' }}>
            経過: {connectingElapsed}秒 / タイムアウト: {Math.round(CONNECTION_TIMEOUT / 1000)}秒
          </div>
        </div>
      )}

      {/* エラー */}
      {phase === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-full px-3 py-3 rounded-lg font-pixel text-center"
            style={{ fontSize: '0.45rem', background: 'rgba(248,113,113,0.1)', border: '1px solid #f8717166', color: '#f87171' }}
          >
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95"
            style={{
              fontSize: '0.45rem',
              background: '#4fc3f722',
              border: '1px solid #4fc3f744',
              color: '#4fc3f7',
            }}
          >
            やり直す
          </button>
        </div>
      )}

      {/* キャンセルボタン（常に表示） */}
      {phase !== 'connected' && (
        <button
          onClick={handleCancel}
          className="w-full py-2 rounded-lg font-pixel transition-all active:scale-95 mt-2"
          style={{
            fontSize: '0.4rem',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid #f8717166',
            color: '#f87171',
          }}
        >
          キャンセル
        </button>
      )}
    </div>
  )
}

/** 接続ステップの表示コンポーネント */
function StepIndicator({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  const color = done ? '#4ade80' : active ? '#ffd700' : '#64748b'
  const icon = done ? '✓' : active ? '...' : '○'

  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel" style={{ fontSize: '0.4rem', color, width: 16, textAlign: 'center' }}>
        {icon}
      </span>
      <span className="font-pixel" style={{ fontSize: '0.4rem', color }}>
        {label}
      </span>
    </div>
  )
}

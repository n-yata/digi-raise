import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import type { CreatureSnapshot } from '../types/battle'
import { encodeCreatureForQR, decodeCreatureFromQR } from '../utils/creatureCodec'

interface QRCreatureScanProps {
  myCreature: CreatureSnapshot
  onOpponentScanned: (opponent: CreatureSnapshot) => void
  onCancel: () => void
}

type ScanMode = 'choose' | 'show_qr' | 'scan_qr' | 'scanned'

const SCANNER_ELEMENT_ID = 'qr-scanner-element'

export default function QRCreatureScan({ myCreature, onOpponentScanned, onCancel }: QRCreatureScanProps) {
  const [mode, setMode] = useState<ScanMode>('choose')
  const [opponent, setOpponent] = useState<CreatureSnapshot | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isStoppingRef = useRef(false)

  // QRデータを非同期で生成
  useEffect(() => {
    if (mode !== 'show_qr') return
    let cancelled = false
    setQrData(null)
    encodeCreatureForQR(myCreature).then(data => {
      if (!cancelled) setQrData(data)
    })
    return () => { cancelled = true }
  }, [mode, myCreature])

  const stopScanner = async () => {
    if (isStoppingRef.current) return
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      isStoppingRef.current = true
      const state = scanner.getState()
      // state 2 = SCANNING, state 3 = PAUSED
      if (state === 2 || state === 3) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // ignore stop errors
    } finally {
      scannerRef.current = null
      isStoppingRef.current = false
    }
  }

  // scan_qr モードに入ったらスキャナー起動
  useEffect(() => {
    if (mode !== 'scan_qr') return

    let cancelled = false

    const startScanner = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 100))
      if (cancelled) return

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      const config = { fps: 10, qrbox: { width: 220, height: 220 } }

      const onSuccess = (decodedText: string) => {
        if (cancelled) return
        void (async () => {
          const parsed = await decodeCreatureFromQR(decodedText)
          if (!parsed) {
            setScanError('正しいクリーチャーデータではありません')
            return
          }
          setScanError(null)
          setOpponent(parsed)
          void stopScanner()
          setMode('scanned')
        })()
      }

      const onError = () => {
        // スキャン試行ごとに呼ばれるため無視
      }

      try {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          onSuccess,
          onError,
        )
      } catch {
        if (!cancelled) {
          setScanError('カメラへのアクセスに失敗しました')
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      void stopScanner()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleBack = async () => {
    if (mode === 'scan_qr') {
      await stopScanner()
    }
    setMode('choose')
    setScanError(null)
  }

  const cardStyle: React.CSSProperties = {
    background: '#16213e',
    border: '1px solid #0f3460',
    borderRadius: 8,
    padding: '12px 16px',
  }

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    borderRadius: 8,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: '0.5rem',
  }

  // ----- choose -----
  if (mode === 'choose') {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode('show_qr')}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(79,195,247,0.1)',
            border: '1px solid #4fc3f766',
            color: '#4fc3f7',
          }}
        >
          自分のQRを表示
        </button>
        <button
          onClick={() => { setScanError(null); setMode('scan_qr') }}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid #ffd70066',
            color: '#ffd700',
          }}
        >
          相手のQRを読み取る
        </button>
        <button
          onClick={onCancel}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid #64748b44',
            color: '#64748b',
          }}
        >
          戻る
        </button>
      </div>
    )
  }

  // ----- show_qr -----
  if (mode === 'show_qr') {
    return (
      <div className="flex flex-col gap-3">
        <div style={cardStyle}>
          <div className="font-pixel mb-2" style={{ fontSize: '0.45rem', color: '#4fc3f7' }}>
            あなたのクリーチャーQRコード
          </div>
          <div className="flex justify-center py-2">
            {qrData ? (
              <div style={{ background: '#fff', padding: 10, borderRadius: 6 }}>
                <QRCodeSVG value={qrData} size={180} level="L" />
              </div>
            ) : (
              <div className="font-pixel" style={{ color: '#64748b', fontSize: '0.45rem', padding: 20 }}>
                QRコード生成中...
              </div>
            )}
          </div>
          <div className="font-pixel mt-2 text-center" style={{ fontSize: '0.4rem', color: '#64748b' }}>
            相手にこのQRを読み取ってもらってください
          </div>
        </div>
        <button
          onClick={() => setMode('choose')}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid #64748b44',
            color: '#64748b',
          }}
        >
          戻る
        </button>
      </div>
    )
  }

  // ----- scan_qr -----
  if (mode === 'scan_qr') {
    return (
      <div className="flex flex-col gap-3">
        <div style={cardStyle}>
          <div className="font-pixel mb-2" style={{ fontSize: '0.45rem', color: '#ffd700' }}>
            相手のQRコードをスキャン
          </div>
          <div
            id={SCANNER_ELEMENT_ID}
            style={{ width: '100%', minHeight: 260, borderRadius: 6, overflow: 'hidden' }}
          />
          {scanError && (
            <div
              className="font-pixel mt-2"
              style={{ fontSize: '0.4rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '6px 8px', borderRadius: 4 }}
            >
              {scanError}
            </div>
          )}
        </div>
        <button
          onClick={handleBack}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid #64748b44',
            color: '#64748b',
          }}
        >
          戻る
        </button>
      </div>
    )
  }

  // ----- scanned -----
  if (mode === 'scanned' && opponent) {
    return (
      <div className="flex flex-col gap-3">
        <div style={{ ...cardStyle, border: '1px solid #4ade8044' }}>
          <div className="font-pixel mb-2" style={{ fontSize: '0.45rem', color: '#4ade80' }}>
            スキャン成功！ 対戦相手
          </div>
          <div className="flex justify-between items-center">
            <span className="font-pixel" style={{ fontSize: '0.6rem', color: '#e0e0e0' }}>
              {opponent.name}
            </span>
            <div className="flex gap-3">
              {[
                { label: 'HP', value: opponent.maxHp },
                { label: 'ATK', value: opponent.atk },
                { label: 'DEF', value: opponent.def },
                { label: 'SPD', value: opponent.spd },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="font-pixel" style={{ fontSize: '0.35rem', color: '#64748b' }}>{label}</span>
                  <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#4fc3f7' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="font-pixel mt-1" style={{ fontSize: '0.4rem', color: '#64748b' }}>
            タイプ: {opponent.type} / Lv.{opponent.level ?? 1}
          </div>
        </div>

        <button
          onClick={() => onOpponentScanned(opponent)}
          className="w-full py-3 rounded-lg font-pixel transition-all active:scale-95 animate-pulse"
          style={{
            fontSize: '0.55rem',
            background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
            backgroundSize: '200% 100%',
            border: '2px solid #ffd700',
            color: '#111',
            boxShadow: '0 0 20px #ffd70088',
            cursor: 'pointer',
          }}
        >
          バトル開始！
        </button>

        <button
          onClick={() => { setOpponent(null); setScanError(null); setMode('choose') }}
          className="font-pixel transition-all active:scale-95"
          style={{
            ...btnBase,
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid #64748b44',
            color: '#64748b',
          }}
        >
          やり直す
        </button>
      </div>
    )
  }

  return null
}

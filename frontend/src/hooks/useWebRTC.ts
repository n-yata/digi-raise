import { useState, useRef, useCallback, useEffect } from 'react'
import { encodeSdp, decodeSdp } from '../utils/sdpCodec'

export type WebRTCRole = 'host' | 'guest'
export type WebRTCConnectionState = 'idle' | 'creating_offer' | 'waiting_answer' | 'creating_answer' | 'connecting' | 'connected' | 'disconnected' | 'failed'

export interface UseWebRTCReturn {
  /** 現在の接続状態 */
  connectionState: WebRTCConnectionState
  /** 自分の役割 */
  role: WebRTCRole | null
  /** ホスト: offer SDPを生成し、圧縮済み文字列を返す */
  createOffer: () => Promise<string>
  /** ゲスト: ホストのoffer SDPを受け取り、answer SDPの圧縮済み文字列を返す */
  acceptOffer: (encodedOffer: string) => Promise<string>
  /** ホスト: ゲストのanswer SDPを受け取り接続を確立する */
  acceptAnswer: (encodedAnswer: string) => Promise<void>
  /** DataChannelでメッセージを送信する */
  send: (data: string) => void
  /** 最後に受信したメッセージ */
  lastMessage: string | null
  /** 接続を閉じる */
  close: () => void
}

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
}

const ICE_GATHER_TIMEOUT = 5000

/**
 * ICE候補の収集完了を待つ
 * gatheringstateがcompleteになるか、タイムアウトで打ち切る
 */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onStateChange)
      resolve()
    }, ICE_GATHER_TIMEOUT)

    function onStateChange() {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout)
        pc.removeEventListener('icegatheringstatechange', onStateChange)
        resolve()
      }
    }

    pc.addEventListener('icegatheringstatechange', onStateChange)
  })
}

export function useWebRTC(): UseWebRTCReturn {
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('idle')
  const [role, setRole] = useState<WebRTCRole | null>(null)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc

    dc.onopen = () => {
      setConnectionState('connected')
    }

    dc.onclose = () => {
      setConnectionState('disconnected')
    }

    dc.onerror = () => {
      setConnectionState('failed')
    }

    dc.onmessage = (event) => {
      setLastMessage(event.data as string)
    }
  }, [])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS)

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setConnectionState('connected')
          break
        case 'disconnected':
          setConnectionState('disconnected')
          break
        case 'failed':
          setConnectionState('failed')
          break
      }
    }

    pcRef.current = pc
    return pc
  }, [])

  /** ホスト: Offer SDPを生成 */
  const createOffer = useCallback(async (): Promise<string> => {
    setRole('host')
    setConnectionState('creating_offer')

    const pc = createPeerConnection()

    // DataChannelを作成（ホスト側が作成する）
    const dc = pc.createDataChannel('battle', {
      ordered: true,
    })
    setupDataChannel(dc)

    // Offerを作成
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // ICE候補の収集を待つ
    await waitForIceGathering(pc)

    const sdp = pc.localDescription?.sdp
    if (!sdp) throw new Error('Failed to create offer SDP')

    setConnectionState('waiting_answer')

    return encodeSdp(sdp)
  }, [createPeerConnection, setupDataChannel])

  /** ゲスト: Offer SDPを受け取り、Answer SDPを返す */
  const acceptOffer = useCallback(async (encodedOffer: string): Promise<string> => {
    setRole('guest')
    setConnectionState('creating_answer')

    const pc = createPeerConnection()

    // ゲスト側: ホストが作成したDataChannelを受け取る
    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel)
    }

    // Offer SDPをセット
    const offerSdp = decodeSdp(encodedOffer)
    await pc.setRemoteDescription({
      type: 'offer',
      sdp: offerSdp,
    })

    // Answerを作成
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    // ICE候補の収集を待つ
    await waitForIceGathering(pc)

    const sdp = pc.localDescription?.sdp
    if (!sdp) throw new Error('Failed to create answer SDP')

    setConnectionState('connecting')

    return encodeSdp(sdp)
  }, [createPeerConnection, setupDataChannel])

  /** ホスト: Answer SDPを受け取り接続を完了 */
  const acceptAnswer = useCallback(async (encodedAnswer: string): Promise<void> => {
    const pc = pcRef.current
    if (!pc) throw new Error('PeerConnection not created')

    const answerSdp = decodeSdp(encodedAnswer)
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    })

    setConnectionState('connecting')
  }, [])

  /** DataChannelでメッセージを送信 */
  const send = useCallback((data: string) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(data)
    }
  }, [])

  /** 接続を閉じる */
  const close = useCallback(() => {
    dcRef.current?.close()
    dcRef.current = null
    pcRef.current?.close()
    pcRef.current = null
    setConnectionState('idle')
    setRole(null)
    setLastMessage(null)
  }, [])

  // クリーンアップ
  useEffect(() => {
    return () => {
      dcRef.current?.close()
      pcRef.current?.close()
    }
  }, [])

  return {
    connectionState,
    role,
    createOffer,
    acceptOffer,
    acceptAnswer,
    send,
    lastMessage,
    close,
  }
}

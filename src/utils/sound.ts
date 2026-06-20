/**
 * 操作時の効果音エンジン。
 *
 * 音声バイナリアセットは持たず、Web Audio API でその場で短い 8bit 風の音を合成する。
 * - PWA を軽量に保つ（アセット不要）
 * - 外部 URL / バイナリのハードコードが発生しない（セキュリティ）
 * - レトロ育成ゲームの世界観に合う電子音
 *
 * AudioContext 非対応環境やブラウザ制限下でも一切クラッシュさせず no-op で安全に通す。
 */

export type SoundType =
  | 'tap'
  | 'feed'
  | 'play'
  | 'trainSuccess'
  | 'trainFail'
  | 'sleep'
  | 'wake'
  | 'evolve'
  | 'hatch'
  | 'battleStart'
  | 'win'
  | 'lose'

/** 1 音の合成パラメータ。 */
interface Tone {
  /** 周波数 (Hz)。 */
  freq: number
  /** この音を鳴らし始めるまでの遅延 (秒)。 */
  at: number
  /** 音の長さ (秒)。 */
  dur: number
  /** 波形。 */
  type?: OscillatorType
  /** 音量 (0〜1)。省略時は既定値。 */
  gain?: number
}

/**
 * 各効果音の合成レシピ。周波数列・波形・タイミングで「らしさ」を表現する。
 * 音名（おおよそ）: A4=440, C5=523, E5=659, G5=784, C6=1047 など。
 */
const RECIPES: Record<SoundType, Tone[]> = {
  // 汎用タップ: 短い高音ブリップ
  tap: [{ freq: 880, at: 0, dur: 0.11, type: 'square', gain: 0.26 }],

  // ごはん: 優しく上昇する2音
  feed: [
    { freq: 523, at: 0, dur: 0.1, type: 'sine' },
    { freq: 698, at: 0.09, dur: 0.14, type: 'sine' },
  ],

  // 遊ぶ: 弾むような明るい3音
  play: [
    { freq: 659, at: 0, dur: 0.08, type: 'triangle' },
    { freq: 880, at: 0.07, dur: 0.08, type: 'triangle' },
    { freq: 1047, at: 0.14, dur: 0.12, type: 'triangle' },
  ],

  // トレ成功: 上昇アルペジオ
  trainSuccess: [
    { freq: 523, at: 0, dur: 0.08, type: 'square' },
    { freq: 659, at: 0.08, dur: 0.08, type: 'square' },
    { freq: 784, at: 0.16, dur: 0.08, type: 'square' },
    { freq: 1047, at: 0.24, dur: 0.16, type: 'square' },
  ],

  // トレ失敗: 下降する短音
  trainFail: [
    { freq: 392, at: 0, dur: 0.12, type: 'sawtooth', gain: 0.16 },
    { freq: 294, at: 0.1, dur: 0.18, type: 'sawtooth', gain: 0.16 },
  ],

  // おやすみ: ゆっくり下降
  sleep: [
    { freq: 523, at: 0, dur: 0.16, type: 'sine' },
    { freq: 392, at: 0.14, dur: 0.24, type: 'sine' },
  ],

  // おはよう: ゆっくり上昇
  wake: [
    { freq: 392, at: 0, dur: 0.14, type: 'sine' },
    { freq: 523, at: 0.12, dur: 0.2, type: 'sine' },
  ],

  // 進化: 華やかな上昇アルペジオ（長め）
  evolve: [
    { freq: 523, at: 0, dur: 0.1, type: 'square' },
    { freq: 659, at: 0.1, dur: 0.1, type: 'square' },
    { freq: 784, at: 0.2, dur: 0.1, type: 'square' },
    { freq: 1047, at: 0.3, dur: 0.12, type: 'square' },
    { freq: 1319, at: 0.42, dur: 0.24, type: 'square' },
  ],

  // 卵ふ化: きらめく上昇音
  hatch: [
    { freq: 784, at: 0, dur: 0.08, type: 'triangle' },
    { freq: 1047, at: 0.07, dur: 0.08, type: 'triangle' },
    { freq: 1319, at: 0.14, dur: 0.16, type: 'triangle' },
  ],

  // バトル開始: 緊張感のある2音
  battleStart: [
    { freq: 440, at: 0, dur: 0.12, type: 'sawtooth' },
    { freq: 440, at: 0.16, dur: 0.18, type: 'sawtooth' },
  ],

  // 勝利: ファンファーレ風
  win: [
    { freq: 523, at: 0, dur: 0.1, type: 'square' },
    { freq: 659, at: 0.1, dur: 0.1, type: 'square' },
    { freq: 784, at: 0.2, dur: 0.1, type: 'square' },
    { freq: 1047, at: 0.3, dur: 0.28, type: 'square' },
  ],

  // 敗北: 下降する悲しい音
  lose: [
    { freq: 523, at: 0, dur: 0.14, type: 'sawtooth', gain: 0.16 },
    { freq: 415, at: 0.13, dur: 0.16, type: 'sawtooth', gain: 0.16 },
    { freq: 311, at: 0.28, dur: 0.3, type: 'sawtooth', gain: 0.16 },
  ],
}

const DEFAULT_GAIN = 0.34
/** 全体の音量を底上げするマスターゲイン係数。小さすぎて聞こえない問題を防ぐ。 */
const MASTER_GAIN = 1.5
const MUTE_KEY = 'digi-raise:muted'

let ctx: AudioContext | null = null
let unlockBound = false

/** ミュート状態。localStorage から初期化（既定: 音あり）。 */
let muted = readMutedFromStorage()
const listeners = new Set<(muted: boolean) => void>()

function readMutedFromStorage(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** AudioContext を遅延生成（未対応環境では null）。 */
function getCtx(): AudioContext | null {
  if (ctx) return ctx
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    return ctx
  } catch {
    return null
  }
}

/**
 * ブラウザの autoplay 制限対策。
 * 初回のユーザージェスチャ（pointerdown / keydown）で AudioContext を resume する。
 * 一度きりで自動解除される。アプリ起動時に一度呼んでおく。
 */
export function initSound(): void {
  if (unlockBound) return
  unlockBound = true
  const unlock = () => {
    const c = getCtx()
    if (c && c.state === 'suspended') {
      c.resume().catch(() => { /* 無視 */ })
    }
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  try {
    window.addEventListener('pointerdown', unlock, { once: false })
    window.addEventListener('keydown', unlock, { once: false })
  } catch {
    /* SSR 等で window が無い場合は無視 */
  }
}

/** 1 音を合成して再生する。 */
function playTone(c: AudioContext, t: Tone): void {
  const osc = c.createOscillator()
  const gainNode = c.createGain()
  const start = c.currentTime + t.at
  // マスターゲインで底上げしつつ、歪み防止に 0.9 で頭打ちにする
  const peak = Math.min(0.9, (t.gain ?? DEFAULT_GAIN) * MASTER_GAIN)

  osc.type = t.type ?? 'square'
  osc.frequency.setValueAtTime(t.freq, start)

  // 短いアタック→少し保持→指数ディケイで、明瞭に聞こえる「ピッ」を作る
  gainNode.gain.setValueAtTime(0.0001, start)
  gainNode.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gainNode.gain.setValueAtTime(peak, start + t.dur * 0.5)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + t.dur)

  osc.connect(gainNode)
  gainNode.connect(c.destination)
  osc.start(start)
  osc.stop(start + t.dur + 0.02)
}

/**
 * 効果音を再生する。ミュート時・未対応環境では何もしない（例外も投げない）。
 */
export function playSound(type: SoundType): void {
  if (muted) return
  try {
    const c = getCtx()
    if (!c) return
    if (c.state === 'suspended') {
      c.resume().catch(() => { /* 無視 */ })
    }
    for (const tone of RECIPES[type]) {
      playTone(c, tone)
    }
  } catch {
    /* 音が出ないことよりアプリ継続を優先 */
  }
}

/** 現在のミュート状態を返す。 */
export function isMuted(): boolean {
  return muted
}

/** ミュート状態を設定し、localStorage に永続化して購読者へ通知する。 */
export function setMuted(value: boolean): void {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* 永続化できなくてもメモリ上の状態は反映する */
  }
  for (const listener of listeners) listener(muted)
}

/** ミュート状態を反転して返す。 */
export function toggleMuted(): boolean {
  setMuted(!muted)
  return muted
}

/** ミュート状態の変更を購読する。返り値で解除できる。 */
export function subscribeMuted(listener: (muted: boolean) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

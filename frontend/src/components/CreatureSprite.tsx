import type { CreatureType, EvolutionStage } from '../types/creature'
import { TYPE_COLORS } from '../data/evolutions'

type AnimState = 'idle' | 'happy' | 'sleeping' | 'attack' | 'evolving' | 'dead' | 'sad' | 'hungry' | 'critical'

interface CreatureSpriteProps {
  type: CreatureType
  stage: EvolutionStage
  animState: AnimState
}

// タイプ別アクセントカラー（ドット絵のワンポイント）
const ACCENT_COLORS: Record<CreatureType, string> = {
  Normal:  '#e5e7eb',
  Fire:    '#ffd166',
  Water:   '#bfefff',
  Plant:   '#ffe066',
  Thunder: '#fff3b0',
  Dark:    '#b388ff',
  Light:   '#fff7cc',
}

// 明度調整: amt>0 で白方向に、amt<0 で黒方向に
function adjust(hex: string, amt: number): string {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))))
  return `#${((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1)}`
}

// ドット絵マップ（16x16）。各文字が色の役割に対応:
// '.' 透明 / 'o' 輪郭 / 'M' 本体(タイプ色) / 'D' 影 / 'L' ハイライト
// 'E' 目の白 / 'P' 瞳 / 'A' アクセント(タイプ別)
const PIXEL_MAPS: Record<EvolutionStage, string[]> = {
  // Stage 0: たまご
  0: [
    '................',
    '......oooo......',
    '....ooLLMMoo....',
    '...oLLMMMMMoo...',
    '..oLMMMMMMMMo...',
    '..oMMMAMMMMMo...',
    '.oMMMMMMMAMMMo..',
    '.oMMAMMMMMMMMo..',
    '.oMMMMMMMMAMMo..',
    '.oMMMMMAMMMMMo..',
    '.oMMMMMMMMMMMo..',
    '..oMMMMMMMMMo...',
    '..oMMMMMMMMMo...',
    '...ooMMMMMoo....',
    '.....ooooo......',
    '................',
  ],
  // Stage 1: ベビー（まんまるスライム）
  1: [
    '................',
    '................',
    '.....oooooo.....',
    '...ooLLMMMMoo...',
    '..oLLMMMMMMMMo..',
    '.oLMMMMMMMMMMMo.',
    '.oMMMPMMMMPMMMo.',
    '.oMMMPMMMMPMMMo.',
    '.oMMMMMMMMMMMMo.',
    '.oMMMMoooMMMMMo.',
    '.oMMMMMMMMMMMMo.',
    '..oMMMMMMMMMMo..',
    '...ooMMMMMMoo...',
    '....oo.oo.oo....',
    '................',
    '................',
  ],
  // Stage 2: チャイルド（耳と足）
  2: [
    '................',
    '...o........o...',
    '...oo......oo...',
    '...oLoo..ooLo...',
    '..oLLMMMMMMLLo..',
    '.oLMMMMMMMMMMo..',
    '.oMMPMMMMMMPMMo.',
    '.oMMPMMMMMMPMMo.',
    '.oMMMMMAAMMMMMo.',
    '.oMMMMMMMMMMMMo.',
    '.oMMMooooMMMMMo.',
    '..oMMMMMMMMMMo..',
    '..oMMMMMMMMMMo..',
    '...oMMo..oMMo...',
    '...ooo....ooo...',
    '................',
  ],
  // Stage 3: ティーン（腕あり）
  3: [
    '................',
    '...oo....oo.....',
    '..oLLo..oLLo....',
    '..oLMo..oMLo....',
    '.ooLMMMMMMMLoo..',
    '.oLMMMMMMMMMMLo.',
    'oLMMPMMMMMMPMMLo',
    'oMMMPMMMMMMPMMMo',
    'oMMMMMMMMMMMMMMo',
    'oMMMMMoooMMMMMMo',
    'oMMMMMMMMMMMMMMo',
    '.oMMMMAAAAMMMMo.',
    '.oMMMMMMMMMMMMo.',
    '..oMMo....oMMo..',
    '..ooo......ooo..',
    '................',
  ],
  // Stage 4: アダルト（角・翼）
  4: [
    '....o......o....',
    '...oLo....oLo...',
    '...oLoo..ooLo...',
    '..ooLLMMMMLLoo..',
    '.oLLMMMMMMMMLLo.',
    'oLMMMMMMMMMMMMLo',
    'oMMMPPMMMMPPMMMo',
    'oMMMPPMMMMPPMMMo',
    'oMMMMMMMMMMMMMMo',
    'oMMMMMAAAAMMMMMo',
    'oMMMMMMMMMMMMMMo',
    'oLMMMMooooMMMMLo',
    '.oLMMMMMMMMMMLo.',
    '..oMMo....oMMo..',
    '..ooo......ooo..',
    '................',
  ],
  // Stage 5: パーフェクト（大型・オーラ）
  5: [
    '..A..o....o..A..',
    '...oLo....oLo...',
    '.A.oLoo..ooLo.A.',
    '..ooLLMMMMLLoo..',
    '.oLLMMMMMMMMLLo.',
    'oLMMMMMMMMMMMMLo',
    'oMMPPMMMMMMPPMMo',
    'oMMPPMMMMMMPPMMo',
    'oMMMMMMMMMMMMMMo',
    'oMMMMAAAAAAMMMMo',
    'oMMMMMMMMMMMMMMo',
    'oLMMMMoooooMMMLo',
    'AoLMMMMMMMMMMLoA',
    '..oMMMo..oMMMo..',
    '..ooo......ooo..',
    '....A......A....',
  ],
}

// ステージごとの1ドットのサイズ(px)。成長に合わせて拡大
const PIXEL_SIZES: Record<EvolutionStage, number> = {
  0: 4, 1: 4, 2: 5, 3: 6, 4: 6, 5: 7,
}

// ドット絵スプライト本体（ステージ別の形 × タイプ別カラー）
function PixelBody({ type, stage, color }: { type: CreatureType; stage: EvolutionStage; color: string }) {
  const map = PIXEL_MAPS[stage]
  const px = PIXEL_SIZES[stage]
  const cols = map[0].length
  const rows = map.length

  const palette: Record<string, string | undefined> = {
    o: adjust(color, -0.55),
    M: color,
    D: adjust(color, -0.28),
    L: adjust(color, 0.4),
    E: '#ffffff',
    P: '#1b1b2e',
    A: ACCENT_COLORS[type],
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${px}px)`,
        gridTemplateRows: `repeat(${rows}, ${px}px)`,
        width: cols * px,
        height: rows * px,
        imageRendering: 'pixelated',
        filter: `drop-shadow(0 0 6px ${color}66)`,
      }}
    >
      {map.flatMap((row, y) =>
        row.split('').map((ch, x) => {
          const bg = palette[ch]
          return <div key={`${x}-${y}`} style={bg ? { background: bg } : undefined} />
        }),
      )}
    </div>
  )
}

export default function CreatureSprite({ type, stage, animState }: CreatureSpriteProps) {
  const color = TYPE_COLORS[type]

  const getAnimClass = () => {
    switch (animState) {
      case 'happy':    return 'animate-happy-jump'
      case 'sleeping': return 'animate-idle-breathe opacity-70'
      case 'attack':   return 'animate-attack-flash'
      case 'evolving': return 'animate-evolve-glow'
      case 'dead':     return 'opacity-40 grayscale'
      case 'sad':      return 'animate-sad-sway'
      case 'hungry':   return 'animate-hungry-droop'
      case 'critical': return 'animate-critical-blink'
      case 'idle':
      default:         return 'animate-idle-breathe'
    }
  }

  const shadowWidth = [40, 55, 70, 85, 100, 115][stage]

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Sleeping ZZZ */}
      {animState === 'sleeping' && (
        <div className="absolute -top-8 right-0 text-sm font-pixel animate-sleep-zzz select-none z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Zzz
        </div>
      )}

      {/* Critical warning */}
      {animState === 'critical' && (
        <div className="absolute pointer-events-none animate-critical-warn font-pixel" style={{ top: '-28px', left: '50%', transform: 'translateX(-50%)', fontSize: 18, color: '#ef4444', whiteSpace: 'nowrap' }}>
          ！
        </div>
      )}

      {/* Main sprite */}
      <div className={`transition-all duration-300 ${getAnimClass()}`}>
        <PixelBody type={type} stage={stage} color={color} />
      </div>

      {/* Shadow */}
      <div
        className="rounded-full mt-1 opacity-30"
        style={{
          width: shadowWidth,
          height: 8,
          background: 'radial-gradient(ellipse, #000 0%, transparent 80%)',
        }}
      />
    </div>
  )
}

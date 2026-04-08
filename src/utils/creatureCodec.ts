import type { CreatureSnapshot } from '../types/battle'
import { compressSvgForQR, decompressSvgFromQR } from './svgCompressor'

const VALID_TYPES = ['Fire', 'Water', 'Plant', 'Thunder', 'Dark', 'Light'] as const
const MAX_STAT = 9999
const MAX_HP = 9999
const MAX_LEVEL = 100
const MAX_STAGE = 4

function isValidStat(v: unknown, max = MAX_STAT): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v > 0 && v <= max
}

/**
 * クリーチャーをQRコード用のJSON文字列にエンコードする。
 * customSvg がある場合は deflate 圧縮して `img` フィールドに含める。
 * 圧縮後サイズが超過した場合は img を省略する（フォールバック）。
 */
export async function encodeCreatureForQR(creature: CreatureSnapshot): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { customSvg, ...rest } = creature

  if (customSvg) {
    const img = await compressSvgForQR(customSvg)
    if (img !== null) {
      return JSON.stringify({ ...rest, img })
    }
  }

  return JSON.stringify(rest)
}

export async function decodeCreatureFromQR(data: string): Promise<CreatureSnapshot | null> {
  try {
    const obj = JSON.parse(data)

    if (typeof obj.name !== 'string' || !obj.name) return null
    if (typeof obj.evolutionStage !== 'number' || !Number.isInteger(obj.evolutionStage) || obj.evolutionStage < 0 || obj.evolutionStage > MAX_STAGE) return null
    if (typeof obj.type !== 'string' || !obj.type) return null
    if (!(VALID_TYPES as readonly string[]).includes(obj.type)) return null
    if (!isValidStat(obj.hp, MAX_HP)) return null
    if (!isValidStat(obj.maxHp, MAX_HP)) return null
    if (obj.hp > obj.maxHp) return null
    if (!isValidStat(obj.atk)) return null
    if (!isValidStat(obj.def)) return null
    if (!isValidStat(obj.spd)) return null

    const level = typeof obj.level === 'number' && Number.isInteger(obj.level) && obj.level >= 1 && obj.level <= MAX_LEVEL
      ? obj.level : 1

    let customSvg: string | undefined
    if (typeof obj.img === 'string' && obj.img) {
      const decompressed = decompressSvgFromQR(obj.img)
      if (decompressed) {
        customSvg = decompressed
      }
    }

    return {
      name: String(obj.name).slice(0, 20),
      evolutionStage: obj.evolutionStage,
      type: obj.type,
      hp: obj.hp,
      maxHp: obj.maxHp,
      atk: obj.atk,
      def: obj.def,
      spd: obj.spd,
      level,
      ...(customSvg ? { customSvg } : {}),
    }
  } catch {
    return null
  }
}

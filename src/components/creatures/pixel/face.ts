import { getExpression } from '../DefaultCreatureBody'
import type { AnimState, EyeVariant, MouthVariant } from '../DefaultCreatureBody'

/**
 * ドット絵の顔パーツのアンカー座標。スプライトに付与すると、animState に応じて
 * 目・口を上書き描画して表情を切り替える（getExpression のバリアントを再利用）。
 * 未指定のスプライトは静止のまま（後方互換）。
 */
export interface FaceAnchors {
  /** 各目の中心セル（通常2つ）。3×3 の範囲を上書きする。 */
  eyes: Array<{ x: number; y: number }>
  /** 口の左上基準セル。4×2 の範囲を上書きする。 */
  mouth?: { x: number; y: number }
}

/**
 * 目 3×3（中心相対）。バリアントごとのパターン。
 * 下地の静止目を確実に覆うため、肌部分は 'r'（ベース色）で塗りつぶす。
 */
const EYE: Record<EyeVariant, string[]> = {
  normal: ['www', 'wbw', 'www'], // ぱっちり開いた目（下地と同じ）
  angry:  ['kkk', 'wbw', 'rrr'], // 上に眉ライン＝怒り
  closed: ['rrr', 'kkk', 'rrr'], // 横一文字＝閉じ目
}

/**
 * 口 4×2（左上基準）。肌部分は 'r' で塗りつぶし、下地の静止口を覆う。
 */
const MOUTH: Record<MouthVariant, string[]> = {
  smile: ['krrk', 'rkkr'], // 口角が上がった笑み
  small: ['rrrr', 'rkkr'], // 小さな口
  open:  ['rkkr', 'roor'], // 開いた口（o＝暗い口内）
  fang:  ['kkkk', 'rwwr'], // 牙をむいた口
}

/**
 * 顔アンカー + animState から、座標 "x,y" → 上書き文字の Map を作る。
 * 文字 '.' は描画せず下地を透過する。
 */
export function buildFaceOverlay(face: FaceAnchors, animState: AnimState): Map<string, string> {
  const { eye, mouth } = getExpression(animState)
  const overlay = new Map<string, string>()
  const put = (x: number, y: number, ch: string) => {
    if (ch !== '.') overlay.set(`${x},${y}`, ch)
  }

  const eyePat = EYE[eye]
  for (const e of face.eyes) {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) put(e.x - 1 + dx, e.y - 1 + dy, eyePat[dy][dx])
    }
  }

  if (face.mouth) {
    const mouthPat = MOUTH[mouth]
    for (let dy = 0; dy < mouthPat.length; dy++) {
      for (let dx = 0; dx < mouthPat[dy].length; dx++) put(face.mouth.x + dx, face.mouth.y + dy, mouthPat[dy][dx])
    }
  }

  return overlay
}

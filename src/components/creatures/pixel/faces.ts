import type { CreatureType, EvolutionStage } from '../../../types/creature'
import type { FaceAnchors } from './face'

/**
 * タイプ × ステージ → 顔パーツのアンカー座標（集中管理）。
 * 目アンカーは各スプライトの瞳セル 'b' の重心（左右）から自動抽出し、
 * 口アンカーは両目中点の下（x=midX-2, y=eyeY+3）を基準に算出・微調整したもの。
 * getPixelSprite() がスプライトデータへこの face をマージする。
 */
export const FACE_ANCHORS: Partial<Record<CreatureType, Partial<Record<EvolutionStage, FaceAnchors>>>> = {
  Fire: {
    1: { eyes: [{ x: 11, y: 12 }, { x: 20, y: 12 }], mouth: { x: 14, y: 15 } },
    2: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    3: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    4: { eyes: [{ x: 7, y: 12 }, { x: 23, y: 12 }], mouth: { x: 13, y: 15 } },
    5: { eyes: [{ x: 6, y: 12 }, { x: 24, y: 12 }], mouth: { x: 13, y: 15 } },
  },
  Water: {
    1: { eyes: [{ x: 11, y: 12 }, { x: 20, y: 12 }], mouth: { x: 14, y: 15 } },
    2: { eyes: [{ x: 11, y: 11 }, { x: 20, y: 11 }], mouth: { x: 14, y: 14 } },
    3: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    4: { eyes: [{ x: 9, y: 10 }, { x: 20, y: 10 }], mouth: { x: 13, y: 13 } },
    5: { eyes: [{ x: 8, y: 10 }, { x: 22, y: 10 }], mouth: { x: 13, y: 13 } },
  },
  Plant: {
    1: { eyes: [{ x: 11, y: 12 }, { x: 20, y: 12 }], mouth: { x: 14, y: 15 } },
    2: { eyes: [{ x: 11, y: 11 }, { x: 20, y: 11 }], mouth: { x: 14, y: 14 } },
    3: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    4: { eyes: [{ x: 7, y: 11 }, { x: 22, y: 11 }], mouth: { x: 13, y: 14 } },
    5: { eyes: [{ x: 7, y: 12 }, { x: 23, y: 12 }], mouth: { x: 13, y: 15 } },
  },
  Thunder: {
    1: { eyes: [{ x: 12, y: 11 }, { x: 19, y: 11 }], mouth: { x: 14, y: 14 } },
    2: { eyes: [{ x: 10, y: 10 }, { x: 21, y: 10 }], mouth: { x: 14, y: 13 } },
    3: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    4: { eyes: [{ x: 8, y: 10 }, { x: 22, y: 10 }], mouth: { x: 13, y: 13 } },
    5: { eyes: [{ x: 7, y: 11 }, { x: 23, y: 11 }], mouth: { x: 13, y: 14 } },
  },
  Dark: {
    1: { eyes: [{ x: 11, y: 12 }, { x: 21, y: 12 }], mouth: { x: 14, y: 15 } },
    2: { eyes: [{ x: 11, y: 12 }, { x: 20, y: 12 }], mouth: { x: 14, y: 15 } },
    3: { eyes: [{ x: 11, y: 12 }, { x: 21, y: 12 }], mouth: { x: 14, y: 15 } },
    4: { eyes: [{ x: 7, y: 12 }, { x: 22, y: 12 }], mouth: { x: 13, y: 15 } },
    5: { eyes: [{ x: 5, y: 12 }, { x: 22, y: 12 }], mouth: { x: 12, y: 15 } },
  },
  Light: {
    1: { eyes: [{ x: 11, y: 12 }, { x: 18, y: 12 }], mouth: { x: 13, y: 15 } },
    2: { eyes: [{ x: 12, y: 10 }, { x: 21, y: 10 }], mouth: { x: 15, y: 13 } },
    3: { eyes: [{ x: 11, y: 10 }, { x: 20, y: 10 }], mouth: { x: 14, y: 13 } },
    4: { eyes: [{ x: 10, y: 9 }, { x: 22, y: 9 }], mouth: { x: 14, y: 12 } },
    5: { eyes: [{ x: 9, y: 10 }, { x: 23, y: 10 }], mouth: { x: 14, y: 13 } },
  },
}

export function getFaceAnchors(type: CreatureType, stage: EvolutionStage): FaceAnchors | undefined {
  return FACE_ANCHORS[type]?.[stage]
}

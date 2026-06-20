import type { CreatureId, EvolutionStage } from '../../../types/creature'
import type { FaceAnchors } from './face'

export const FACE_ANCHORS: Partial<Record<CreatureId, Partial<Record<EvolutionStage, FaceAnchors>>>> = {}

export function getFaceAnchors(creatureId: CreatureId, stage: EvolutionStage): FaceAnchors | undefined {
  return FACE_ANCHORS[creatureId]?.[stage]
}

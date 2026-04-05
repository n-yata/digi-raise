import { useEffect, useRef } from 'react'
import type { Creature } from '../types/creature'
import { applyTimeUpdate } from '../utils/gameLogic'
import { saveCreature } from '../utils/storage'
import { canEvolve } from '../utils/evolution'

interface UseTimeUpdateOptions {
  creature: Creature | null
  devMode: boolean
  onUpdate: (creature: Creature) => void
  onDeath: () => void
  onEvolutionReady: () => void
}

export function useTimeUpdate({
  creature,
  devMode,
  onUpdate,
  onDeath,
  onEvolutionReady,
}: UseTimeUpdateOptions) {
  const tickInterval = devMode ? 5000 : 30000
  const prevEvolvable = useRef(false)

  useEffect(() => {
    if (!creature || !creature.isAlive) return

    const tick = () => {
      const updated = applyTimeUpdate(creature, devMode)
      if (!updated.isAlive) {
        saveCreature(updated)
        onUpdate(updated)
        onDeath()
        return
      }
      saveCreature(updated)
      onUpdate(updated)

      const nowEvolvable = canEvolve(updated)
      if (nowEvolvable && !prevEvolvable.current) {
        onEvolutionReady()
      }
      prevEvolvable.current = nowEvolvable
    }

    const id = setInterval(tick, tickInterval)
    return () => clearInterval(id)
  }, [creature, devMode, tickInterval, onUpdate, onDeath, onEvolutionReady])
}

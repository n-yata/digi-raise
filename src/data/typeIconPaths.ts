import type { CreatureType } from '../types/creature'

export const TYPE_ICON_PATHS: Record<CreatureType, string> = {
  Normal: 'M12 3 L20 8 L20 16 L12 21 L4 16 L4 8 Z',
  Fire: 'M12 2 C7 8 5 12 8 18 C9 15 10 12 11 14 C12 11 13 14 14 17 C16 14 17 15 18 18 C20 12 18 8 12 2 Z',
  Water: 'M12 3 C12 3 5 11 5 16 A7 7 0 0 0 19 16 C19 11 12 3 12 3 Z',
  Plant: 'M12 3 C6 5 3 10 3 14 C3 18 7 21 12 21 C17 21 21 18 21 14 C21 10 18 5 12 3 Z M12 21 L12 11',
  Thunder: 'M14 2 L7 13 L12 13 L10 22 L18 9 L13 9 Z',
  Dark: 'M21 12 A9 9 0 1 1 12 3 A6 6 0 0 0 21 12 Z',
  Light: 'M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z',
}

import type { ItemSpriteData } from './ItemSprite'

/**
 * 食事アクションで登場する食べ物のドット絵（16×16）。
 * クリーチャー本体と同じ文字グリッド + パレット方式でレトロな世界観へ統一する。
 * 効果量には一切影響せず、どれが出ても結果は同じ（演出差のみ）。
 */

// 肉（骨付き）
const meat: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '....oooo........',
    '..oommmmoo......',
    '.ommmhhmmmo.....',
    '.ommhhhhmmo.....',
    'ommmhhhmmmmo....',
    'ommmmmmmmmmo....',
    '.ommmmmmmmoo....',
    '..oommmmmo......',
    '....obbbbo......',
    '.....obbbo......',
    '......obbbo.....',
    '......obsbbo....',
    '.......obbbo....',
    '........oooo....',
    '................',
  ],
  palette: { o: '#5b3a1e', m: '#c8732e', h: '#e8a262', b: '#f3e7cf', s: '#d9c3a0' },
}

// りんご
const apple: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '.......so.......',
    '......sggo......',
    '.....oggo.......',
    '...oooroooo.....',
    '..orrrrrrro.....',
    '.orrrrrrrrro....',
    '.orhhrrrrrro....',
    'orhhrrrrrrro....',
    'orrrrrrrrrro....',
    'orrrrrrrrrro....',
    '.orrrrrrrro.....',
    '.orrrrrrrro.....',
    '..orrrrrro......',
    '...oooooo.......',
    '................',
  ],
  palette: { o: '#6b1f1f', r: '#e0413e', h: '#f4827d', g: '#4cae50', s: '#7a4a22' },
}

// おにぎり
const riceball: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '.......oo.......',
    '......orro......',
    '.....orrrro.....',
    '....orrrrrro....',
    '...orrrrrrrro...',
    '..orrrrrrrrrro..',
    '..orrrrrrrrrro..',
    '.orrrrrrrrrrrro.',
    '.orrrrrrrrrrrro.',
    '.onnnnnnnnnnnno.',
    '.onnnnnnnnnnnno.',
    '.onnnnnnnnnnnno.',
    '..oooooooooooo..',
    '................',
    '................',
  ],
  palette: { o: '#9aa0a6', r: '#f7f7f2', n: '#2a2f33' },
}

/** 食べ物ドット絵の一覧。食事時にランダムで 1 つ選ばれる。 */
export const FOOD_SPRITES: ItemSpriteData[] = [meat, apple, riceball]

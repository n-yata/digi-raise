import type { ItemSpriteData } from './ItemSprite'

/**
 * 遊びアクションで登場する遊び道具のドット絵（16×16）。
 * クリーチャー本体と同じ文字グリッド + パレット方式でレトロな世界観へ統一する。
 * 効果量には一切影響せず、どれが出ても結果は同じ（演出差のみ）。
 */

// ボール
const ball: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '....oooooo......',
    '..oowwwwwwoo....',
    '.owwwwrrwwwwo...',
    '.owwwrrrrwwwo...',
    'owwwwrrrrwwwwo..',
    'owwrrrrrrrrwwo..',
    'owrrrrrrrrrrwo..',
    'owwrrrrrrrrwwo..',
    'owwwwrrrrwwwwo..',
    '.owwwrrrrwwwo...',
    '.owwwwrrwwwwo...',
    '..oowwwwwwoo....',
    '....oooooo......',
    '................',
    '................',
  ],
  palette: { o: '#333a45', w: '#f2f4f6', r: '#e0413e' },
}

// ディスク（フリスビー）
const disc: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '....oooooooo....',
    '..oobbbbbbbboo..',
    '.obbhhhhhhhbbo..',
    'obbbbbbbbbbbbbbo',
    '.obbbbbbbbbbbbo.',
    '..oobbbbbbbboo..',
    '....oooooooo....',
    '................',
    '................',
    '................',
    '................',
  ],
  palette: { o: '#1f4f8a', b: '#3a9bd0', h: '#86d2f2' },
}

// ぬいぐるみ（くま）
const teddy: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '..oo......oo....',
    '.obbo....obbo...',
    '.obbo....obbo...',
    '.oobbbbbbbboo...',
    'obbbbbbbbbbbbo..',
    'obbhbbbbbbhbbo..',
    'obkkbbbbbbkkbo..',
    'obbbbbbbbbbbbo..',
    'obbbnnnnnnbbbo..',
    'obbbnnkknnbbbo..',
    '.obbnnnnnnbbo...',
    '..obbbbbbbbo....',
    '...oobbbboo.....',
    '.....oooo.......',
    '................',
  ],
  palette: { o: '#4a2f1a', b: '#a9743f', h: '#c8915c', k: '#2a1c10', n: '#e6c79a' },
}

/** 遊び道具ドット絵の一覧。遊び時にランダムで 1 つ選ばれる。 */
export const TOY_SPRITES: ItemSpriteData[] = [ball, disc, teddy]

import type { ItemSpriteData } from './ItemSprite'

/**
 * トレーニング連打ミニゲームのサンドバッグのドット絵（16×24）。
 * クリーチャー本体や遊び道具と同じ文字グリッド + パレット方式で、
 * レトロな世界観へ統一する。タップ数に応じて 無傷→ヒビ→大破 と段階変化する。
 *
 * palette:
 *   c: チェーン / m: 留め具 / b: 本体 / d: ベルト / h: ハイライト
 *   k: ヒビ・裂け目の影 / f,g: 飛び出す詰め物
 */
const PALETTE: Record<string, string> = {
  c: '#9ca3af',
  m: '#6b7280',
  b: '#b45309',
  d: '#78350f',
  h: '#f59e0b',
  k: '#1c1917',
  f: '#fef3c7',
  g: '#fde68a',
}

// 無傷
const intact: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '.......cc.......',
    '.......cc.......',
    '.....mmmmmm.....',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bhbbbbbbbb...',
    '...bhbbbbbbbb...',
    '...bhbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bbbbbbbbbb...',
    '....bbbbbbbb....',
    '....bbbbbbbb....',
    '.....dddddd.....',
    '................',
    '................',
    '................',
  ],
  palette: PALETTE,
}

// ヒビ（中央を縦に走る亀裂）
const cracked: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '.......cc.......',
    '.......cc.......',
    '.....mmmmmm.....',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bhbbkbbbbb...',
    '...bhbkbbbbbb...',
    '...bhbbkbbbbb...',
    '...bbbbkbbbbb...',
    '...bbbkbbbbbb...',
    '...bbbbkbbbbb...',
    '...bbbbbkbbbb...',
    '...bbbbkbbbbb...',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bbbbbbbbbb...',
    '....bbbbbbbb....',
    '....bbbbbbbb....',
    '.....dddddd.....',
    '................',
    '................',
    '................',
  ],
  palette: PALETTE,
}

// 大破（裂け目から詰め物が飛び出す）
const broken: ItemSpriteData = {
  // prettier-ignore
  grid: [
    '................',
    '.......cc.......',
    '.......cc.......',
    '.....mmmmmm.....',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bhbbkkbbbb...',
    '...bhbkffkbbb...',
    '...bbkfggfkbb...',
    '...bkffggffkb...',
    '...bbkfggfkbb...',
    '...bbbkffkbbb...',
    '...bbbbkkbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...dddddddddd...',
    '...bbbbbbbbbb...',
    '....bbbbbbbb....',
    '....bbbbbbbb....',
    '.....dddddd.....',
    '................',
    '................',
    '................',
  ],
  palette: PALETTE,
}

/** 破壊段階（0:無傷 / 1:ヒビ / 2:大破）に対応するサンドバッグのドット絵。 */
export const SANDBAG_SPRITES: readonly [ItemSpriteData, ItemSpriteData, ItemSpriteData] = [
  intact,
  cracked,
  broken,
]

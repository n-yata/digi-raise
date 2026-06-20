/** 食事・遊びアクション演出で表示するアイテムの指定。 */
export interface ActionItem {
  /** 食べ物（food）か遊び道具（toy）か。 */
  kind: 'food' | 'toy'
  /** 対応するスプライト配列（FOOD_SPRITES / TOY_SPRITES）のインデックス。 */
  index: number
}

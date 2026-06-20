# タスクリスト: クリーチャーの表情切り替え

## P1. 基盤（プロト）
- [x] `face.ts`: `FaceAnchors` 型・`buildFaceOverlay()`（getExpression 再利用、目3×3/口4×2上書き）
- [x] `PixelSprite`: `animState` 受け取り・`face` で表情上書き（後方互換）
- [x] `fireAdult` でプロト確認（idle/sleeping/critical をスクショ確認）→ シャビ承認

## P2. critical「！」削除（シャビ指示）
- [x] `CreatureSprite` の critical「！」オーバーレイ削除
- [x] 未使用化した `critical-warn` keyframes/utility の掃除（tailwind.config.js）

## P3. 攻撃モーション
- [x] 現状（attackLunge＋怒り目＋牙）を実物確認 → シャビ「このままでOK」

## P4. 表情を全30体へ展開
- [x] 瞳 'b' から目・口アンカーを自動抽出（30体）
- [x] `faces.ts`: `FACE_ANCHORS[type][stage]` を集中定義
- [x] `getPixelSprite()` を face マージに変更
- [x] `fireAdult` の face 埋め込みを削除（集中管理へ統一）
- [x] 代表（Fire/Water/Dark × idle/sleeping/critical/sad）をスクショ確認、アンカー妥当

## P5. テスト・仕上げ
- [x] 整合性テスト追加（T6: 30体アンカーが grid 内・目アンカーが瞳'b'近傍／buildFaceOverlay 単体3件）
- [x] `npm run build` / `npm run test:run` 通過（212 passed）
- [ ] クルトワ（security-engineer）レビュー

## P6. リリース
- [ ] retrospective.md
- [ ] コミット → push → PR → main マージ → worktree 片付け

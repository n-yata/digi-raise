# 決定事項ログ — クリーチャーの表情切り替え

## D-001 表情は既存 getExpression を再利用
- ドット絵に animState 連動の表情（目/口）を付ける。新たに表情ルールを作らず、
  既存 `DefaultCreatureBody.getExpression()`（eye: normal/angry/closed, mouth: smile/fang/small/open）
  をそのまま再利用し、SVG 版と挙動を一致させる。

## D-002 顔オーバーレイ方式（base grid を上書き）
- `PixelSprite` に `animState` を渡し、`face.ts` の `buildFaceOverlay()` が目3×3・口4×2を
  上書き描画する。アンカー未指定のスプライトは静止のまま（後方互換）。
- 肌部分は `r` で塗りつぶし、下地の静止目/口を確実に覆う。

## D-003 顔アンカーは集中管理（faces.ts）＋ getPixelSprite でマージ
- 各スプライトデータ（30ファイル）には face を埋め込まず、`faces.ts` の
  `FACE_ANCHORS[type][stage]` に一元管理。`getPixelSprite()` が data と face をマージして返す。
- 理由: 座標を一覧で調整でき、29ファイルを個別編集せずに済む。

## D-004 アンカーは瞳 'b' から自動抽出
- 目アンカーは grid 中の瞳セル `'b'` を x<16/x>=16 で左右に分け重心を取る。
  牙の `'w'` と混ざらないため確実。口アンカーは両目中点の下（x=midX-2, y=eyeY+3）を既定とし、
  スポット確認でズレを補正。

## D-005 critical の「！」警告マークを削除（シャビ指示）
- `CreatureSprite` の critical 時「！」オーバーレイを削除。

## D-006 攻撃モーションは現状維持（シャビ確認）
- 既存の `attackLunge`（踏み込み突進＋発光）＋新表情（怒り目＋牙）で十分、とシャビ判断。
  モーション強化・ヒットエフェクト追加は今回スコープ外。

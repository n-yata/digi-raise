# レトロフォント統一（DotGothic16）

## 日付
2026-06-20

## 背景・課題
- 全体の文字フォントをレトロにしたいという要望。
- 既存は `Press Start 2P` を指定していたが、これはラテン文字専用のピクセルフォントで日本語グリフを持たない。
- そのため日本語 UI（本作の大半のテキスト）は OS 標準の monospace にフォールバックし、レトロに見えていなかった。

## 対応
日本語・ラテン文字の両方をカバーするドットマトリクス調の和文フォント `DotGothic16`（Google Fonts）に統一。

| ファイル | 変更内容 |
|---------|---------|
| `index.html` | Google Fonts の link を `Press+Start+2P` → `DotGothic16` |
| `src/index.css` | `body` の `font-family` を `'Press Start 2P'` → `'DotGothic16'` |
| `tailwind.config.js` | `fontFamily.pixel` を `"Press Start 2P"` → `"DotGothic16"` |

`font-pixel` ユーティリティも DotGothic16 を指すため、バトル系のラベル・数値を含め各コンポーネントを触らず統一できた。

## 検証
- `npm run build`（tsc + vite）成功。
- dev サーバーを起動しタイトル画面を目視確認。日本語（「デジレイズ」「育てて・進化させて・最強へ」「はじめから」）が全てドットマトリクス調で表示されることを確認。
- クルトワ（security-engineer）レビュー: Critical / High ゼロ、コミット可。

## 決定事項
- フォント方針はシャビが「DotGothic16 で統一」を選択（見出し Press Start 2P 併用案・PixelMplus 比較案は不採用）。

## 補足（既存課題・本変更とは無関係）
- `npm run lint` の `eslint` が devDependencies に未宣言で実行不可。本変更とは無関係の既存問題のため未対応。

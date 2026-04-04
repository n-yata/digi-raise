# デジレイズ / DigiRaise

デジモン風の育成ゲーム PWA です。クリーチャーを育て、進化させましょう。

詳細な仕様は [`docs/spec.md`](docs/spec.md) を参照してください。

## 遊び方

1. タイトル画面でクリーチャーの名前とタイプを選択
2. タマゴをタップして孵化させる
3. えさ・トレーニング・あそぶ・ねるで世話をする
4. 条件を満たすと進化する（最終的にアルティメットを目指せ）
5. 放置しすぎると死んでしまう……

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果の確認
npm run lint     # Lint チェック
```

## デプロイ

GitHub Pages でホスティング。ビルド後 `dist/` を `gh-pages` ブランチへプッシュします。

公開 URL: `https://<username>.github.io/digi-raise/`

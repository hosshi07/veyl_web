# VEYL Official Website

VEYL公式Webサイト。トップページ・共通レイアウトと、紙資料を操作するAnomorph Archiveを実装したローカル開発用プロジェクトです。

## 起動

Node.js 20.9以降を使用してください。

```sh
npm ci
npm run dev
```

http://127.0.0.1:3000 を開きます。

```sh
npm run typecheck
npm run build
npm start
```

## コンテンツの更新

- `src/content/site.json`: 世界観・Arc・配布状態。
- `src/content/anomorphs.json`: トップに掲載するアノモルフ。ID、slugは変更しない運用を推奨。
- `src/content/news.json`: お知らせ。日付の降順で表示。現状の1件はサンプル。
- `src/content/archive-records.json`: 内部端末アーカイブの資料。現在は6件の仮データ。
- `public/images/`: ローカル素材。画像を差し替える際はJSONのパスと説明文も確認。
- `src/lib/content.ts`: コンテンツ取得層。CMS導入時にここから置換。

## 現在の状態

共通ヘッダー、スマートフォン用メニュー、フッター、ヒーロー、ゲーム紹介、アノモルフ2体の紹介、Arcの紹介、お知らせの開閉、配布準備中の案内を実装しています。「アノモルフ」は `/anomorphs` の内部端末へ移動し、その他はトップ内セクションへ移動します。ダウンロードはクリックできるボタンとして表示しません。

アーカイブの操作・データ更新・構成・検証範囲は [docs/anomorph-archive.md](docs/anomorph-archive.md) を参照してください。

実在する外部配布先・公式SNSが未指定のため、外部リンクは設けていません。記事詳細や正式な資料データは次段階です。robotsは制作中のためnoindexです。公開時に配布情報、記事、素材の権利、metadata（サイトURL・OG画像を含む）、robotsを確認してください。

ゲーム本体の `assets/ui/title_bg_befor.jpg`、`assets/anomorphs/d002/parts/full_body.png`、`story/anomorph/R-001/full.png` のコピーを使用しています。世界観と公開用アノモルフ概要は `story/` の資料を要約しています。隠しストーリーや戦闘数値は掲載していません。Arcの図形はCSS/SVGによる仮素材です。

設計・追加予定ルートは [docs/architecture.md](docs/architecture.md) を参照してください。

## 開発方針

サーバーコンポーネントを基本とし、操作と装飾演出だけをクライアント側に置いています。本文は初期HTMLに含まれます。端末の「視差効果を減らす」設定に対応し、外部フォントや自動再生動画は使用しません。依存バージョンはpackage-lock.jsonで固定します。

Windows環境でTurbopackのCSS処理が停止したため、開発・本番ビルドはWebpackを明示しています。整形には `npm run format`、整形確認には `npm run format:check` を使用します。

## 確認済み（2026-11-16）

- 本番ビルド、TypeScriptの型チェック、整形チェックが成功。
- ブラウザーでPC表示と幅390pxのスマートフォン表示を確認。
- モバイルメニューの開閉とEscape操作、お知らせ本文の展開・収納を確認。
- 全4画像の読込成功、モバイル表示の横方向へのはみ出しがないことを確認。
- 表示確認用のスクリーンショットは `docs/home-preview.png`。

Arcの一覧・詳細ページ、ニュース詳細、実際の配布、外部リンク、ページ間遷移演出は今後の段階です。

参考: [Next.js](https://nextjs.org/docs/app/getting-started/installation)、[Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs)、[Motionのアクセシビリティ](https://motion.dev/docs/react-accessibility)。

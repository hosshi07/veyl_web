# VEYL Web 設計

## 第1段階の範囲

Next.js App Router / TypeScript / Tailwind CSS / Motion for React でトップページと共通レイアウトを制作する。ゲーム紹介・アノモルフ・Arc・ニュース・ダウンロードはトップ内の各セクションへ案内する。未実装ページへのリンクや未公開の配布URLは設けない。公開・デプロイは本段階に含めない。

## ディレクトリ

```text
src/
  app/                  ページ、metadata、共通レイアウト、グローバルCSS
  components/
    layout/             ヘッダー、モバイルナビ、フッター
    home/               トップ固有の各セクション
    ui/                 アイコン、セクション見出し、演出
  content/              JSONコンテンツ（公開用データのみ）
  lib/                  型、コンテンツ取得層、サイト設定
public/images/          差し替え可能なローカル画像
docs/                   設計・運用・開発ロードマップ
```

## コンポーネントと描画

- RootLayout → SiteHeader / main / SiteFooter。基本はServer Components。
- Home → Hero / WorldSection / ArchiveSection / ArcSection / NewsSection / DownloadSection。
- ブラウザー処理はHeaderのメニュー、Reveal、MotionProviderに限定。
- 本文はSSRで常に表示。スクロール時の演出は装飾要素に適用し、JavaScriptなしでも情報を読める。
- MotionConfigとuseReducedMotion、およびCSSのprefers-reduced-motionで軽減設定に対応。GSAPは必要になった時点で導入する。

## データ管理

JSONを画面から直接参照せず、`lib/content.ts` の取得関数を経由する。識別子に安定したslugを使用し、型は `lib/types.ts` に定義する。将来CMSへ移行する際は取得層を置換し、表示側の型を維持する。

- `anomorphs.json`: ID / slug / 名称 / 分類 / ランク / 概要 / 画像 / 出典。
- `news.json`: slug / 日付 / 種類 / タイトル / 本文。初期のお知らせは明示的にサンプル扱い。
- `site.json`: 紹介文、Arcの公開済み説明、配布状態。公式外部URLは確認できるまで空欄。
- 長文記事を追加する段階でMarkdown + frontmatterを導入。MDXは埋め込みが必要な時だけ採用し、信頼できるローカルコンテンツのみ扱う。
- 草稿、非公開設定、ゲーム本体の隠しストーリーはコピーしない。

## 追加予定のルート

| ルート                             | 内容                           | 段階 |
| ---------------------------------- | ------------------------------ | ---- |
| `/`                                | トップ / 共通レイアウト        | 1    |
| `/about`                           | ゲーム紹介 / キャラクター      | 2    |
| `/anomorphs` / `/anomorphs/[slug]` | フィルター付き図鑑 / 詳細      | 2    |
| `/arcs` / `/arcs/[slug]`           | 装備一覧 / 詳細                | 3    |
| `/news` / `/news/[slug]`           | 記事一覧 / Markdown記事        | 3    |
| `/download`                        | 動作環境 / 配布先 / 外部リンク | 4    |

## Anomorph Archive（追加実装）

`/anomorphs` に内部端末風の紙資料アーカイブを追加。`components/archive`、`content/archive-records.json`、`lib/archive-model.ts` で表示・公開資料・状態遷移を分離しています。ヘッダーのアノモルフ導線はこの画面へ接続し、トップ内の紹介は維持しています。詳細と更新方法は [anomorph-archive.md](anomorph-archive.md) を参照してください。個別URLや検索UIは今後の段階です。

## 品質基準

スマートフォン対応、キーボード操作、スキップリンク、見出し階層、画像代替テキスト、アニメーション軽減。ヒーローのみ優先読込、その他は遅延読込。外部フォント・外部画像・自動再生動画に依存しない。型チェックと本番ビルド、可能な環境でデスクトップとモバイルの表示・操作を確認する。

# 公開用の起動手順

## Docker Composeで公開する

Docker EngineとComposeがある公開先で、リポジトリのルートから実行します。

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 -f web
```

`http://サーバーのIP:3000`でアクセスできます。コンテナ内はPM2の
`pm2-runtime`でNext.jsのstandaloneサーバーを`0.0.0.0:3000`に起動します。
一般ユーザーで実行し、コンテナの再起動はDocker、アプリの再起動はPM2が担当します。
Dockerサービス自体もホスト起動時に起動するよう設定してください。

外側を8080番にする場合は、ルートの`.env`に次を記入して起動します。

```dotenv
WEB_PORT=8080
```

ポート設定は全インターフェースに公開します。公開先のファイアウォールや
クラウドの受信規則では、選択したTCPポート（標準3000番）を許可してください。
自宅回線ではルーターのポート転送も必要です。HTTPSを使用する場合は、
リバースプロキシで証明書を設定し、`ports`を`127.0.0.1:3000:3000`に変更して
プロキシ経由で公開できます。

更新時も`docker compose up -d --build`を実行します。停止は
`docker compose down`、PM2の確認は`docker compose exec web pm2 list`です。
ヘルスチェックは状態を表示しますが、不健康状態だけでは自動再起動しません。

## 既存のLinuxコンテナ内で直接PM2を使用する

Dockerfileを使用せず、既存のコンテナに配置する場合の手順です。
Node.js 24を使用し、リポジトリのルートで実行してください。

```sh
npm ci
npm run build
npm install --global pm2@6.0.14
pm2-runtime start ecosystem.config.cjs
```

`pm2-runtime`はフォアグラウンドで実行されるため、コンテナの起動コマンドに
指定してください。既にinit/systemdで常駐しているコンテナでバックグラウンド管理する場合は、
最後のコマンドを`pm2 start ecosystem.config.cjs`に置き換え、`pm2 save`と
`pm2 startup`の表示する手順で起動時の復元を設定してください。
コンテナ外からのアクセスには、ホスト側でTCP 3000番の転送・許可が必要です。

更新時は再ビルドしてから
`pm2 restart ecosystem.config.cjs --update-env`を実行します。

## 公開状態の確認

```sh
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/anomorphs
```

別端末からも公開先のIPとポートで確認してください。
現在のページには検索エンジン向けの`noindex`指定が残っています。
検索結果への掲載も開始する場合は`src/app/layout.tsx`の`robots`を変更して
再ビルドしてください。公開ドメインが決まったらmetadataのURL・OG画像も確認します。

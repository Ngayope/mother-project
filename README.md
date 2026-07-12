# あかりチャット（mother プロジェクトの核）

「あなたの人生は、あなたのものでいい」という体験を、あかりとの対話として届けるアプリ。
設計思想は `design/` を、あかりの人格は `design/system_prompt_v8.md` を参照。

- フロント：Vite + React（`src/`）
- バックエンド：サーバレス関数（`api/chat.js`）が Claude API をプロキシし、APIキーをサーバ側に隠す
- モデル：Claude Opus 4.8（`claude-opus-4-8`、adaptive thinking）

## ローカルで動かす

```bash
npm install
cp .env.example .env      # .env を開いて ANTHROPIC_API_KEY を実際のキーに書き換える
npm run dev
```

`npm run dev` は Vite の開発サーバを立ち上げ、`/api/chat` も同じプロセスで処理する
（Vercel CLI は不要）。表示された `http://localhost:5173` をブラウザで開く。

※ `.env`（＝APIキー）を編集したら、開発サーバを再起動して読み直す。

## 共有リンクを出す（Vercel にデプロイ）

1. このプロジェクトを GitHub にプッシュ
2. [Vercel](https://vercel.com/) で「New Project」→ リポジトリを import（フレームワークは Vite が自動検出される）
3. Project Settings → Environment Variables に **`ANTHROPIC_API_KEY`** を追加（値は本物のキー）
4. Deploy。発行された URL を、試してもらう人に共有する

`api/` 配下は Vercel が自動でサーバレス関数にする。`api/_akari.js` は先頭が `_` のため
関数にはならず、`api/chat.js` からの読み込み専用モジュールとして扱われる。

## 構成

```
index.html
src/
  main.jsx          エントリ
  AkariChat.jsx     チャットUI（/api/chat を叩く）
  index.css         灯りの世界観（暖色）
api/
  chat.js           サーバレス関数：Claude API プロキシ（キーを保持）
  _akari.js         v8 プロンプト＋あいさつ＋時間帯の雰囲気
vite.config.js      本番=Vercel関数 / ローカル=dev ミドルウェアで /api/chat を提供
```

## MVP スコープ（design/04）

含む：あかりとの対話（①対話のコア）、最初のトーン、時間帯の雰囲気。
含まない：セッションをまたぐ記憶、コミュニティ、図鑑、モバイルアプリ、マネタイズ。
検証する一点：**あかりとの対話が「自分の人生は自分のものでいい」体験を生むか。**

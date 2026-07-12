# あかりチャット（mother プロジェクトの核）

「あなたの人生は、あなたのものでいい」という体験を、あかりとの対話として届けるアプリ。
設計思想は `design/` を、あかりの人格は `prompts/system_prompt_v9.md` を参照。

- フロント：Vite + React（`src/`）
- バックエンド：サーバレス関数（`api/chat.js`）が Claude API をプロキシし、APIキーをサーバ側に隠す
- モデル：Claude Opus 4.8（`claude-opus-4-8`、adaptive thinking）
- 実行中の人格プロンプトは `api/_akari.js` に埋め込み（v9 相当。あいさつを画面側で出すため
  「会話のはじまり」節だけ外してある）。あいさつ本文は `shared/greeting.js` が唯一の出典。

## ローカルで動かす

```bash
npm install
cp .env.example .env      # .env を開いて ANTHROPIC_API_KEY を実際のキーに書き換える
npm run dev
```

`npm run dev` は Vite の開発サーバを立ち上げ、`/api/chat` も同じプロセスで処理する
（Vercel CLI は不要）。表示された `http://localhost:5173` をブラウザで開く。

※ `.env`（＝APIキー）を編集したら、開発サーバを再起動して読み直す。

## 開発中はお金をかけずに試す（モックモード）

見た目や操作感を確認するだけなら、本物の Claude を呼ばず（＝**課金ゼロ**で）動かせる。

```bash
# Windows PowerShell
$env:AKARI_MOCK="1"; npm run dev
# macOS / Linux
AKARI_MOCK=1 npm run dev
```

モックモードでは、あかり“風”の返答が返るだけで API は一切呼ばれない。画面右上に
「モック・課金なし」と表示される。会話の質そのものを見たいときだけ、モックを外して
本物のキーで動かす。

- `AKARI_MOCK=1` のときは、`.env` にキーがあっても本物を呼ばない（モックが優先）。
- キーを設定していない環境でも、自動でモックに落ちる（設定漏れで止まらない）。

## 共有リンクを出す（Vercel にデプロイ）

1. このプロジェクトを GitHub にプッシュ
2. [Vercel](https://vercel.com/) で「New Project」→ リポジトリを import（フレームワークは Vite が自動検出される）
3. Project Settings → Environment Variables に **`ANTHROPIC_API_KEY`** を追加（値は本物のキー）
4. Deploy。発行された URL を、試してもらう人に共有する

`api/` 配下は Vercel が自動でサーバレス関数にする。`api/_akari.js` は先頭が `_` のため
関数にはならず、`api/chat.js` からの読み込み専用モジュールとして扱われる。

### 公開時のAPIキー保護（大事）

発行した URL が誰でも叩ける状態だと、知らない人の利用でAPI料金がかさむ。試用は
シェアハウスの3人に限りたいので、次のどちらかで守る：

- **Vercel Deployment Protection**（推奨・アプリ改修不要）：Vercel の Project
  Settings → Deployment Protection で「Password Protection」等を有効化し、3人にだけ
  パスワードを渡す。
- URL を公開・共有しない（unlisted 運用）。最低限これは守る。

サーバ側にも保険を入れてある：直近 40 メッセージだけをAPIに渡す（履歴が伸びても
トークン費が青天井にならない）、1回の入力は 6000 文字まで、過負荷時は自動リトライ。

## 構成

```
index.html          メタ／favicon／OGプレビュー／theme-color
src/
  main.jsx          エントリ（エラー境界つき）
  AkariChat.jsx     チャットUI（/api/chat を叩く。モバイル対応・会話保持・リトライ）
  index.css         灯りの世界観（暖色）・モバイル高さ・reduced-motion
api/
  chat.js           サーバレス関数：Claude API プロキシ（キー保持・履歴上限・リトライ・モック分岐）
  _akari.js         v9相当プロンプト＋時間帯の雰囲気＋モック応答生成
shared/
  greeting.js       あいさつ（クライアントとサーバの唯一の出典）
vite.config.js      本番=Vercel関数 / ローカル=dev ミドルウェアで /api/chat を提供
```

## MVP スコープ（design/04）

含む：あかりとの対話（①対話のコア）、最初のトーン、時間帯の雰囲気。
含まない：セッションをまたぐ記憶、コミュニティ、図鑑、モバイルアプリ、マネタイズ。
検証する一点：**あかりとの対話が「自分の人生は自分のものでいい」体験を生むか。**

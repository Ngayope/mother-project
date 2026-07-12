import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import chatHandler from "./api/chat.js";

// ローカル開発用のプラグイン。
// 本番(Vercel)では api/chat.js がサーバレス関数になるが、
// ローカルの `npm run dev` では Vercel CLI 無しで同じハンドラを /api/chat に載せる。
function apiDevServer() {
  return {
    name: "akari-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/chat", (req, res) => {
        chatHandler(req, res).catch((e) => {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "サーバ内部エラー", detail: String(e) }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env の中身（VITE_ 接頭辞なしも含む）を process.env に載せ、
  // dev ミドルウェアのハンドラから ANTHROPIC_API_KEY を読めるようにする。
  const env = loadEnv(mode, process.cwd(), "");
  if (!process.env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }

  // モックモードかどうかをクライアントにも伝える（バッジを最初から出すため）。
  // AKARI_MOCK=1 で dev を起動したときだけ true。本番(Vercel)では未設定＝false。
  const mockMode = process.env.AKARI_MOCK === "1" || env.AKARI_MOCK === "1";

  return {
    define: {
      __AKARI_MOCK__: JSON.stringify(mockMode),
    },
    plugins: [react(), apiDevServer()],
  };
});

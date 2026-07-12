// あかりチャットのバックエンド（サーバレス関数）。
// ANTHROPIC_API_KEY をサーバ側だけで保持し、Claude Messages API をプロキシする。
// Vercel の Node ランタイムと、ローカルの Vite dev ミドルウェア（vite.config.js）の
// 両方で動くよう、生の Node の req/res だけを使っている。

import { buildSystem } from "./_akari.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

// req からJSONボディを読む。Vercel は req.body を渡すことがあるが、
// Vite dev ミドルウェアでは生ストリームなので、両対応にする。
async function readJson(req) {
  if (req.body != null) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "POST でリクエストしてください。" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, {
      error: "サーバに ANTHROPIC_API_KEY が設定されていません。",
    });
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "リクエストの形式が正しくありません。" });
  }

  const { messages, hour } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return sendJson(res, 400, { error: "messages が空です。" });
  }

  // 会話履歴：入室（synthetic user）→ あいさつ(assistant) → 以降のやりとり。
  // 先頭の synthetic user により、user/assistant が交互に並ぶ。
  const apiMessages = [
    { role: "user", content: "（あかりのいる場所に、入ってきた）" },
    ...messages,
  ];

  let anthropicRes;
  try {
    anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        // 「返す前に必ず考える」= adaptive thinking。あかりの設計そのもの。
        thinking: { type: "adaptive" },
        system: buildSystem(hour),
        messages: apiMessages,
      }),
    });
  } catch {
    return sendJson(res, 502, {
      error: "あかりと繋がれませんでした。もう一度試してみてください。",
    });
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => "");
    return sendJson(res, 502, {
      error: "あかりと繋がれませんでした。もう一度試してみてください。",
      status: anthropicRes.status,
      detail,
    });
  }

  const data = await anthropicRes.json();

  // 安全性による拒否（Opus は基本ほぼ無いが、念のため）。
  if (data.stop_reason === "refusal") {
    return sendJson(res, 200, {
      reply: "……ごめんなさい、いまはうまく言葉が出てきませんでした。",
    });
  }

  // thinking ブロックは除き、text ブロックだけを返す。
  const reply = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return sendJson(res, 200, {
    reply: reply || "……（うまく言葉が出てきませんでした）",
  });
}

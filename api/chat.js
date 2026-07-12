// あかりチャットのバックエンド（サーバレス関数）。
// ANTHROPIC_API_KEY をサーバ側だけで保持し、Claude Messages API をプロキシする。
// Vercel の Node ランタイムと、ローカルの Vite dev ミドルウェア（vite.config.js）の
// 両方で動くよう、生の Node の req/res だけを使っている。

import { buildSystem, mockReply } from "./_akari.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

// コスト・堅牢性の上限。
const MAX_HISTORY = 40; // APIに渡す直近メッセージ数（＝トークン費の抑制）
const MAX_INPUT_CHARS = 6000; // 1回の入力の上限（極端な長文・悪用を弾く）
const MAX_MESSAGES = 400; // 受け取る配列長の安全上限（巨大ペイロード対策）
const MAX_TOKENS = 4096;
const REQUEST_TIMEOUT_MS = 60000; // 1回のAPI呼び出しのタイムアウト
const MAX_RETRIES = 2; // 過負荷・一時エラー時の再試行回数

// モックモード：本物の Claude を呼ばず、あかり風の返答を返す（＝課金ゼロ）。
// AKARI_MOCK=1 で明示的に有効化。APIキーが無い環境でも自動でモックに落ちる
// （＝設定漏れでも 500 で止まらず、開発を続けられる）。
function isMock() {
  return process.env.AKARI_MOCK === "1" || !process.env.ANTHROPIC_API_KEY;
}

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

// メッセージ配列を検証し、role/content の形が正しいものだけに整える。
function sanitizeMessages(messages) {
  const cleaned = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    if (typeof m.content !== "string") continue;
    cleaned.push({ role: m.role, content: m.content });
  }
  return cleaned;
}

// 直近 MAX_HISTORY 件に絞る。先頭に synthetic user を足す都合上、
// 切り出した先頭は assistant で始まるように整える（user/assistant の交互を保つ）。
function capHistory(messages) {
  let tail = messages;
  if (tail.length > MAX_HISTORY) tail = tail.slice(-MAX_HISTORY);
  if (tail.length && tail[0].role === "user") tail = tail.slice(1);
  return tail;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 一時的な失敗（過負荷・混雑・ゲートウェイ系）は少し待って再試行する。
function isRetriable(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529;
}

// タイムアウト付きで1回叩く。
async function callOnce(apiKey, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// リトライ込みで Anthropic を呼ぶ。成否は呼び出し側で判定する。
async function callAnthropic(apiKey, body) {
  let lastErr = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(400 * attempt * attempt + 300); // 300ms, 700ms, 1900ms…
    try {
      const res = await callOnce(apiKey, body);
      if (res.ok || !isRetriable(res.status)) return res; // 成功 or 再試行しても無駄なエラー
      lastErr = new Error(`status ${res.status}`);
    } catch (e) {
      lastErr = e; // ネットワーク断・タイムアウト等 → 再試行
    }
  }
  throw lastErr || new Error("unreachable");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "POST でリクエストしてください。" });
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "リクエストの形式が正しくありません。" });
  }

  const { messages: rawMessages, hour } = payload || {};
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return sendJson(res, 400, { error: "messages が空です。" });
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return sendJson(res, 413, { error: "会話が長すぎます。" });
  }

  const messages = sanitizeMessages(rawMessages);
  if (messages.length === 0) {
    return sendJson(res, 400, { error: "messages の形式が正しくありません。" });
  }

  // 最後の発話（＝今回あかりが応える相手の言葉）が長すぎないか。
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser && lastUser.content.length > MAX_INPUT_CHARS) {
    return sendJson(res, 413, {
      error: "ちょっと長すぎるみたいです。少しずつ、話してもらえますか?",
    });
  }

  // モックモード：ここで完結（本物のAPIには触れない）。
  if (isMock()) {
    return sendJson(res, 200, { reply: mockReply(messages), mock: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 会話履歴：入室（synthetic user）→ あいさつ(assistant) → 以降のやりとり。
  // 先頭の synthetic user により、user/assistant が交互に並ぶ。
  const apiMessages = [
    { role: "user", content: "（あかりのいる場所に、入ってきた）" },
    ...capHistory(messages),
  ];

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // 「返す前に必ず考える」= adaptive thinking。あかりの設計そのもの。
    thinking: { type: "adaptive" },
    system: buildSystem(hour),
    messages: apiMessages,
  };

  let anthropicRes;
  try {
    anthropicRes = await callAnthropic(apiKey, body);
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

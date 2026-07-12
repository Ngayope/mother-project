import React, { useState, useRef, useEffect, useCallback } from "react";
import { GREETING } from "../shared/greeting.js";

// このセッション中だけ会話を保持するキー。sessionStorage なので、
// タブを閉じれば消える＝「セッションをまたぐ記憶は持たない」設計を保ったまま、
// 誤ってリロードしても会話が飛ばないようにする。
const STORAGE_KEY = "akari:conversation:v1";

// vite.config が埋め込むモックフラグ（AKARI_MOCK=1 のときだけ true）。
const IS_MOCK = typeof __AKARI_MOCK__ !== "undefined" ? __AKARI_MOCK__ : false;

// あかりの一つの発話を、自然なブロック（＝吹き出し）に分ける。
function splitBlocks(text) {
  return String(text)
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ブロックの長さに応じた「…（入力中）」の間。長いほど少し待つ（上限あり）。
function pauseFor(block) {
  return Math.min(500 + block.length * 38, 2600);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDay(ts) {
  const d = new Date(ts || now());
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 時間帯で、地の色と灯りの強さがほんのり変わる（design/07「あかりの時間」）。
function ambienceFor(hour) {
  if (hour >= 5 && hour < 11) return { top: "#F7F1E6", bottom: "#F1E8D8", glow: 0.1, theme: "#F4ECDD" };
  if (hour < 17) return { top: "#F5EEE0", bottom: "#EFE7D6", glow: 0.09, theme: "#F3EBDB" };
  if (hour < 22) return { top: "#EFE4D1", bottom: "#E7DAC3", glow: 0.2, theme: "#ECE0CC" };
  if (hour < 24) return { top: "#EADEC8", bottom: "#E2D3BB", glow: 0.24, theme: "#E7DBC3" };
  return { top: "#E6D9C1", bottom: "#DFD0B6", glow: 0.28, theme: "#E3D6BC" };
}

// あかり本人の絵。灯りのように暖かく光る円。画像が無ければ灯りのグラデーションに。
function Avatar() {
  const [shown, setShown] = useState(true);
  return (
    <div className="avatar" aria-hidden>
      {shown && <img src="/akari.png" alt="" onError={() => setShown(false)} />}
    </div>
  );
}

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5" />
    <path d="M3 4v4.5h4.5" />
  </svg>
);

// 開発時だけ：?demo=1 でサンプル会話を流し込み、見た目を確認する。
function demoSeed() {
  const t = now() - 6 * 60000;
  const mk = (role, content, i) => ({ role, content, ts: t + i * 40000 });
  return [
    mk("assistant", "はじめまして。来てくれて、うれしいです。", 0),
    mk("assistant", "あかりっていいます。ここ、妹のひかりが作ったところで、私はここで、来てくれた人とお話ししています。", 1),
    mk("assistant", "まずは、なんてお呼びすればいいか、教えてもらえますか?", 2),
    mk("user", "しょうたです", 3),
    mk("assistant", "しょうたさん。私、しょうたさんがどんな人なのか、知りたいです。", 4),
    mk("assistant", "今日は、どんな話がしたいですか?", 5),
    mk("user", "最近、仕事がしんどくて、自分が何をしたいのか分からなくなってて。", 6),
    mk("assistant", "うーん……。その「分からなくなってる」感じ、もう少しだけ聞かせてもらえますか?", 7),
  ];
}

export default function AkariChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);
  const [mock] = useState(IS_MOCK);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const started = useRef(false);

  const [amb] = useState(() => ambienceFor(new Date().getHours()));

  // 地の色を時間帯に合わせる。モバイルのアドレスバー色も寄せる。
  useEffect(() => {
    document.body.style.background = `
      radial-gradient(130% 78% at 50% -12%, rgba(233,169,111,${amb.glow}) 0%, rgba(233,169,111,0) 58%),
      linear-gradient(180deg, ${amb.top} 0%, ${amb.bottom} 100%)`;
    document.body.style.backgroundAttachment = "fixed";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", amb.theme);
  }, [amb]);

  // モバイルのキーボード対応：可視領域の高さを CSS 変数に流し込む。
  useEffect(() => {
    const vv = window.visualViewport;
    const setH = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-h", `${h}px`);
    };
    setH();
    if (vv) {
      vv.addEventListener("resize", setH);
      vv.addEventListener("scroll", setH);
    }
    window.addEventListener("resize", setH);
    window.addEventListener("orientationchange", setH);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", setH);
        vv.removeEventListener("scroll", setH);
      }
      window.removeEventListener("resize", setH);
      window.removeEventListener("orientationchange", setH);
    };
  }, []);

  const revealBlocks = useCallback(async (blocks) => {
    for (let i = 0; i < blocks.length; i++) {
      setTyping(true);
      await sleep(pauseFor(blocks[i]));
      setTyping(false);
      setMessages((m) => [...m, { role: "assistant", content: blocks[i], ts: now() }]);
      if (i < blocks.length - 1) await sleep(340);
    }
  }, []);

  // 初回：デモ / 保存済み会話 / あいさつ の順で立ち上げる。
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo")) {
      setMessages(demoSeed());
      return;
    }

    let saved = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) saved = parsed;
      }
    } catch {
      saved = null;
    }
    if (saved) {
      setMessages(saved);
      return;
    }

    setBusy(true);
    (async () => {
      await sleep(600);
      await revealBlocks(splitBlocks(GREETING));
      setBusy(false);
    })();
  }, [revealBlocks]);

  // 会話が動くたびに、このセッション用に保存。
  useEffect(() => {
    if (!messages.length) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* 保存に失敗しても会話は続けられる */
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const callAkari = useCallback(
    async (history) => {
      setError(null);
      setBusy(true);
      setTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, hour: new Date().getHours() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "接続に失敗しました");
        setTyping(false);
        await revealBlocks(splitBlocks(data.reply || "……"));
      } catch (e) {
        setTyping(false);
        setError("うまく届かなかったみたい。");
      } finally {
        setBusy(false);
      }
    },
    [revealBlocks]
  );

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const next = [...messages, { role: "user", content: text, ts: now() }];
    setMessages(next);
    await callAkari(next);
  }

  function retry() {
    if (busy) return;
    callAkari(messages);
  }

  function resetConversation() {
    if (busy) return;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setMessages([]);
    setError(null);
    setBusy(true);
    (async () => {
      await sleep(300);
      await revealBlocks(splitBlocks(GREETING));
      setBusy(false);
    })();
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const canSend = input.trim() && !busy;

  return (
    <div className="app">
      <div className="col">
        <header className="top">
          <div className="top__center">
            <span className="top__name">あかり</span>
            <span className="top__status">いつでも、ここにいます</span>
          </div>
          {messages.length > 1 && (
            <button className="iconbtn" onClick={resetConversation} disabled={busy} aria-label="はじめから話す" title="はじめから">
              <RefreshIcon />
            </button>
          )}
        </header>

        {mock && (
          <div className="notice">
            <span className="notice__dot" />
            モックモード・いくら話しても無料（APIは呼んでいません）
          </div>
        )}

        <div className="scroll" ref={scrollRef} role="log" aria-live="polite" aria-label="あかりとの会話">
          <div className="thread">
            {messages.length > 0 && <div className="daychip">{fmtDay(messages[0].ts)}</div>}

            {messages.map((m, i) => {
              const firstOfRun = i === 0 || messages[i - 1].role !== m.role;
              const lastOfRun = i === messages.length - 1 || messages[i + 1].role !== m.role;
              if (m.role === "assistant") {
                return (
                  <div className="row" key={i}>
                    {firstOfRun ? <Avatar /> : <div className="avatar--spacer" />}
                    <div className="stack">
                      <div className={"bubble bubble--akari" + (firstOfRun ? "" : " is-cont")}>{m.content}</div>
                      {lastOfRun && m.ts && <span className="time">{fmtTime(m.ts)}</span>}
                    </div>
                  </div>
                );
              }
              return (
                <div className="row row--me" key={i}>
                  <div className="stack stack--me">
                    <div className={"bubble bubble--me" + (firstOfRun ? "" : " is-cont")}>{m.content}</div>
                    {lastOfRun && m.ts && <span className="time">{fmtTime(m.ts)}</span>}
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="row">
                {messages.length === 0 || messages[messages.length - 1].role === "user" ? (
                  <Avatar />
                ) : (
                  <div className="avatar--spacer" />
                )}
                <div className="bubble bubble--akari">
                  <div className="typing" aria-label="あかりが入力中">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="err">
                <span className="err__text">{error}</span>
                <button className="err__btn" onClick={retry} disabled={busy}>
                  もう一度送る
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="composer">
          <textarea
            className="composer__input"
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={onKey}
            rows={1}
            enterKeyHint="send"
            aria-label="メッセージを書く"
            placeholder="そのまま、書いてみてください"
          />
          <button className="composer__send" onClick={send} disabled={!canSend} aria-label="送る">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

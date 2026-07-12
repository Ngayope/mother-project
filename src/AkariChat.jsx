import React, { useState, useRef, useEffect, useCallback } from "react";
import { GREETING } from "../shared/greeting.js";

// このセッション中だけ会話を保持するキー。sessionStorage なので、
// タブを閉じれば消える＝「セッションをまたぐ記憶は持たない」設計を保ったまま、
// 誤ってリロードしても会話が飛ばないようにする。
const STORAGE_KEY = "akari:conversation:v1";

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

// 時間帯で、地の色と灯りの強さがほんのり変わる（design/07「あかりの時間」）。
// 急かさず、生活感と安心だけを静かに添える。
function ambienceFor(hour) {
  if (hour >= 5 && hour < 11) return { top: "#F7F1E6", bottom: "#F1E8D8", glow: 0.1, theme: "#F4ECDD" };
  if (hour < 17) return { top: "#F5EEE0", bottom: "#EFE7D6", glow: 0.09, theme: "#F3EBDB" };
  if (hour < 22) return { top: "#EFE4D1", bottom: "#E7DAC3", glow: 0.2, theme: "#ECE0CC" };
  if (hour < 24) return { top: "#EADEC8", bottom: "#E2D3BB", glow: 0.24, theme: "#E7DBC3" };
  return { top: "#E6D9C1", bottom: "#DFD0B6", glow: 0.28, theme: "#E3D6BC" };
}

// あかり本人の絵。円の中に収め、灯りのように暖かく光らせる（呼吸するように明滅）。
// 画像（public/akari.png）が未設置のときは、灯りのグラデーションにそっとフォールバック。
function Lamp({ size = 40 }) {
  const [shown, setShown] = useState(true);
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 40%, #FFE3BE 0%, #F6B878 52%, #E1904F 100%)",
        animation: "ak-breathe 4.5s ease-in-out infinite",
      }}
    >
      {shown && (
        <img
          src="/akari.png"
          alt=""
          onError={() => setShown(false)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 20%", // 顔が入るよう上寄り。絵に合わせて調整可
            display: "block",
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "5px 2px" }} aria-label="あかりが入力中">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#c2ad92",
            display: "inline-block",
            animation: `ak-blink 1.3s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

export default function AkariChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null); // 文字列 or null。表示中はリトライ可。
  const [mock, setMock] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const started = useRef(false);
  const restored = useRef(false);

  const [amb] = useState(() => ambienceFor(new Date().getHours()));

  // 地の色を時間帯に合わせる（画面全体・上ほどほのかに灯る）。
  // モバイルのアドレスバー色（theme-color）も時間帯に寄せる。
  useEffect(() => {
    document.body.style.background = `
      radial-gradient(120% 70% at 50% -10%, rgba(233,169,111,${amb.glow}) 0%, rgba(233,169,111,0) 55%),
      linear-gradient(180deg, ${amb.top} 0%, ${amb.bottom} 100%)`;
    document.body.style.backgroundAttachment = "fixed";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", amb.theme);
  }, [amb]);

  // モバイルのキーボード対応：可視領域の高さを CSS 変数に流し込み、
  // キーボードが出ても入力欄が隠れないようにする（LINE のような挙動）。
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
      setMessages((m) => [...m, { role: "assistant", content: blocks[i] }]);
      if (i < blocks.length - 1) await sleep(340);
    }
  }, []);

  // 初回：保存済みの会話があれば戻す。無ければ、あいさつを静かに立ち上げる。
  useEffect(() => {
    if (started.current) return;
    started.current = true;

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
      restored.current = true;
      setMessages(saved);
      return;
    }

    setBusy(true);
    (async () => {
      await sleep(600); // 一拍の静けさ
      await revealBlocks(splitBlocks(GREETING));
      setBusy(false);
    })();
  }, [revealBlocks]);

  // 会話が動くたびに、このセッション用に保存（アニメーション中の途中経過も含めてよい）。
  useEffect(() => {
    if (!messages.length) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* 保存に失敗しても会話は続けられる */
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  // 実際の送信処理。history をそのまま /api/chat に渡す（上限はサーバ側で管理）。
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
        if (data.mock) setMock(true);
        setTyping(false);
        await revealBlocks(splitBlocks(data.reply || "……"));
      } catch (e) {
        setTyping(false);
        setError("うまく繋がりませんでした。");
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
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    await callAkari(next);
  }

  // 送信失敗時：直前のやり取り（＝現在の messages）をそのまま再送。
  // ユーザーの発話は既にスレッドに残っているので、二重に積まない。
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
    setMock(false);
    restored.current = false;
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
    <div style={styles.page}>
      <div style={styles.column}>
        <header style={styles.header}>
          <Lamp size={30} />
          <div style={styles.name}>あかり</div>
          <div style={styles.headerRight}>
            {mock && (
              <span style={styles.mockBadge} title="開発モード：本物のAPIは呼んでいません（課金なし）">
                モック・課金なし
              </span>
            )}
            {messages.length > 1 && (
              <button
                onClick={resetConversation}
                disabled={busy}
                style={styles.resetBtn}
                aria-label="最初から話す"
              >
                最初から
              </button>
            )}
          </div>
        </header>

        <div ref={scrollRef} style={styles.scroll} role="log" aria-live="polite" aria-label="あかりとの会話">
          <div style={styles.thread}>
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} style={styles.rowAkari}>
                  <div style={styles.avatarSlot}>
                    {isFirstOfRun(messages, i) ? <Lamp size={34} /> : null}
                  </div>
                  <div style={styles.bubbleAkari}>{m.content}</div>
                </div>
              ) : (
                <div key={i} style={styles.rowUser}>
                  <div style={styles.bubbleUser}>{m.content}</div>
                </div>
              )
            )}
            {typing && (
              <div style={styles.rowAkari}>
                <div style={styles.avatarSlot}>
                  {messages.length === 0 || messages[messages.length - 1].role === "user" ? (
                    <Lamp size={34} />
                  ) : null}
                </div>
                <div style={styles.bubbleAkari}>
                  <TypingDots />
                </div>
              </div>
            )}
            {error && (
              <div style={styles.errorRow}>
                <span style={styles.errorText}>{error}</span>
                <button onClick={retry} disabled={busy} style={styles.retryBtn}>
                  もう一度送る
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.composer}>
          <textarea
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
            placeholder="ここに、そのまま書いてみてください"
            style={styles.textarea}
          />
          <button
            onClick={send}
            disabled={!canSend}
            aria-label="送る"
            style={{
              ...styles.sendBtn,
              opacity: canSend ? 1 : 0.35,
              cursor: canSend ? "pointer" : "default",
            }}
          >
            送る
          </button>
        </div>
      </div>
    </div>
  );
}

// 連続するあかりの吹き出しは、先頭だけ灯りを出す（同じ人が続けて話している感じ）。
function isFirstOfRun(messages, i) {
  if (messages[i].role !== "assistant") return false;
  return i === 0 || messages[i - 1].role !== "assistant";
}

const styles = {
  page: {
    height: "var(--app-h, 100dvh)",
    display: "flex",
    justifyContent: "center",
  },
  column: {
    width: "100%",
    maxWidth: 620,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "0 6px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "max(14px, env(safe-area-inset-top)) 16px 12px",
  },
  name: {
    fontFamily: "var(--serif)",
    fontSize: 19,
    letterSpacing: "0.06em",
    color: "#5a4b3c",
  },
  headerRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  mockBadge: {
    fontSize: 11,
    color: "#8a6d3b",
    background: "rgba(233, 169, 111, 0.16)",
    border: "1px solid rgba(180, 130, 70, 0.25)",
    borderRadius: 999,
    padding: "3px 9px",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  resetBtn: {
    fontSize: 12,
    color: "var(--ink-soft)",
    background: "transparent",
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "5px 11px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
  },
  thread: {
    padding: "10px 14px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  avatarSlot: { width: 34, flexShrink: 0, alignSelf: "flex-end" },
  rowAkari: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    animation: "ak-rise 0.5s ease",
  },
  rowUser: {
    display: "flex",
    justifyContent: "flex-end",
    animation: "ak-rise 0.5s ease",
  },
  bubbleAkari: {
    maxWidth: "80%",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: "6px 18px 18px 18px",
    padding: "13px 17px",
    lineHeight: 1.95,
    fontSize: 15.5,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    color: "var(--ink)",
    boxShadow: "0 2px 10px rgba(120, 90, 55, 0.05)",
  },
  bubbleUser: {
    maxWidth: "80%",
    background: "linear-gradient(140deg, #F6C88E 0%, #EEAF74 100%)",
    borderRadius: "18px 6px 18px 18px",
    padding: "13px 17px",
    lineHeight: 1.95,
    fontSize: 15.5,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    color: "#5a4025",
    boxShadow: "0 3px 12px rgba(210, 150, 90, 0.18)",
  },
  errorRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "4px 0",
    flexWrap: "wrap",
  },
  errorText: { fontSize: 13, color: "#b56b49" },
  retryBtn: {
    fontSize: 13,
    color: "#fff",
    background: "linear-gradient(140deg, #E9A96F, #D5824A)",
    border: "none",
    borderRadius: 999,
    padding: "7px 15px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  composer: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 14px calc(16px + env(safe-area-inset-bottom))",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1px solid var(--line)",
    borderRadius: 22,
    padding: "12px 18px",
    fontSize: 16, // iOS で入力時に自動ズームしない下限
    lineHeight: 1.6,
    fontFamily: "inherit",
    outline: "none",
    background: "rgba(255, 253, 249, 0.85)",
    color: "var(--ink)",
    maxHeight: 140,
    boxShadow: "0 2px 10px rgba(120, 90, 55, 0.04)",
  },
  sendBtn: {
    border: "none",
    borderRadius: 22,
    padding: "12px 20px",
    fontSize: 14,
    fontFamily: "var(--serif)",
    letterSpacing: "0.08em",
    color: "#fff",
    background: "linear-gradient(140deg, #E9A96F, #D5824A)",
    flexShrink: 0,
    height: 46,
    boxShadow: "0 3px 12px rgba(200, 135, 75, 0.28)",
    transition: "opacity 0.2s ease",
  },
};

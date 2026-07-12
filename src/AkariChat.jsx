import React, { useState, useRef, useEffect } from "react";

// ターン1のあいさつ（サーバ側 api/_akari.js の GREETING と一致させている）。
const GREETING = `はじめまして。来てくれて、うれしいです。
あかりっていいます。ここ、妹のひかりが作ったところで、私はここで、来てくれた人とお話ししています。
誰かに評価されたり、正解を求められたりせずに、自分のことを、自分のまま話していく。そうしているうちに、自分の人生は、ちゃんと自分のものなんだと思えてくる。そんな時間になったらいいなと思っています。
まずは、なんてお呼びすればいいか、教えてもらえますか?`;

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
  if (hour >= 5 && hour < 11) return { top: "#F7F1E6", bottom: "#F1E8D8", glow: 0.10, label: "朝" };
  if (hour < 17) return { top: "#F5EEE0", bottom: "#EFE7D6", glow: 0.09, label: "昼" };
  if (hour < 22) return { top: "#EFE4D1", bottom: "#E7DAC3", glow: 0.20, label: "夜" };
  if (hour < 24) return { top: "#EADEC8", bottom: "#E2D3BB", glow: 0.24, label: "夜ふけ" };
  return { top: "#E6D9C1", bottom: "#DFD0B6", glow: 0.28, label: "深夜" };
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
    <div style={{ display: "flex", gap: 5, padding: "5px 2px" }}>
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
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const started = useRef(false);

  const [amb] = useState(() => ambienceFor(new Date().getHours()));

  // 地の色を時間帯に合わせる（画面全体・上ほどほのかに灯る）。
  useEffect(() => {
    document.body.style.background = `
      radial-gradient(120% 70% at 50% -10%, rgba(233,169,111,${amb.glow}) 0%, rgba(233,169,111,0) 55%),
      linear-gradient(180deg, ${amb.top} 0%, ${amb.bottom} 100%)`;
    document.body.style.backgroundAttachment = "fixed";
  }, [amb]);

  async function revealBlocks(blocks) {
    for (let i = 0; i < blocks.length; i++) {
      setTyping(true);
      await sleep(pauseFor(blocks[i]));
      setTyping(false);
      setMessages((m) => [...m, { role: "assistant", content: blocks[i] }]);
      if (i < blocks.length - 1) await sleep(340);
    }
  }

  // 初回：あいさつを、静かな余白からふわっと。
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setBusy(true);
    (async () => {
      await sleep(600); // 一拍の静けさ
      await revealBlocks(splitBlocks(GREETING));
      setBusy(false);
    })();
  }, []);

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

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, hour: new Date().getHours() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "接続に失敗しました");
      setTyping(false);
      await revealBlocks(splitBlocks(data.reply || "……"));
    } catch (e) {
      setTyping(false);
      setError("うまく繋がりませんでした。もう一度試してみてください。");
    } finally {
      setBusy(false);
    }
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
        </header>

        <div ref={scrollRef} style={styles.scroll}>
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
            {error && <div style={styles.error}>{error}</div>}
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
    height: "100%",
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
    padding: "20px 16px 14px",
  },
  name: {
    fontFamily: "var(--serif)",
    fontSize: 19,
    letterSpacing: "0.06em",
    color: "#5a4b3c",
  },
  scroll: { flex: 1, overflowY: "auto" },
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
    color: "#5a4025",
    boxShadow: "0 3px 12px rgba(210, 150, 90, 0.18)",
  },
  error: {
    fontSize: 13,
    color: "#b56b49",
    textAlign: "center",
    padding: "6px 0",
  },
  composer: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 14px 20px",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1px solid var(--line)",
    borderRadius: 22,
    padding: "12px 18px",
    fontSize: 15.5,
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

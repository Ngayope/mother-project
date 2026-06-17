import React, { useState } from "react";

// ───────────────────────────────────────────────
// 画像を入れる場所（あとで生成した画像URLに差し替えるだけ）
//   AKARI_IMG … あかりの顔。空文字なら、仮のSVGが表示される。
//   ROOM_IMG  … 部屋の背景。空文字なら、仮のSVGの部屋が表示される。
const AKARI_IMG = ""; // 例: "https://.../akari.png"
const ROOM_IMG = "";  // 例: "https://.../room.png"
// ───────────────────────────────────────────────

// ── あかり：画像があれば画像、なければ仮のSVG ──────────
function Akari({ size = 46 }) {
  if (AKARI_IMG) {
    return (
      <img src={AKARI_IMG} alt="あかり" width={size} height={size}
        style={{ borderRadius: "50%", objectFit: "cover", display: "block" }} />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="hg" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#FFEDCB" />
          <stop offset="100%" stopColor="#F6D3A0" />
        </radialGradient>
        <linearGradient id="hh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C5A43" />
          <stop offset="100%" stopColor="#5E4334" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#hg)" />
      <path d="M27 53 C27 17 73 17 73 53 C79 53 79 67 70 68 C72 85 60 93 50 93 C40 93 28 85 30 68 C21 67 21 53 27 53Z" fill="url(#hh)" />
      <ellipse cx="50" cy="57" rx="20" ry="22" fill="#F8DBBE" />
      <circle cx="40" cy="61" r="3.3" fill="#FF9E7A" opacity="0.45" />
      <circle cx="60" cy="61" r="3.3" fill="#FF9E7A" opacity="0.45" />
      <path d="M41 54 Q44 51.5 47 54" fill="none" stroke="#5E4334" strokeWidth="2" strokeLinecap="round" />
      <path d="M53 54 Q56 51.5 59 54" fill="none" stroke="#5E4334" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 67 Q50 71 55 67" fill="none" stroke="#C16B5A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 37 C30 17 70 17 70 39 C70 25 60 21 50 21 C40 21 30 25 30 37Z" fill="url(#hh)" />
    </svg>
  );
}

// ── 仮の部屋（ROOM_IMG が無いとき用。薄く、目立たせない）──
function RoomBackdrop() {
  if (ROOM_IMG) {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: `url(${ROOM_IMG})`, backgroundSize: "cover",
        backgroundPosition: "center top",
      }} />
    );
  }
  // 仮：窓とランプだけの、ごく薄い部屋
  return (
    <svg viewBox="0 0 420 900" preserveAspectRatio="xMidYMin slice" aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.5 }}>
      {/* 窓 */}
      <rect x="232" y="40" width="150" height="170" rx="8" fill="#FBE7C2" stroke="#E6C794" strokeWidth="2" />
      <line x1="307" y1="40" x2="307" y2="210" stroke="#E6C794" strokeWidth="2" />
      <line x1="232" y1="125" x2="382" y2="125" stroke="#E6C794" strokeWidth="2" />
      {/* 窓の外の夕方の光 */}
      <rect x="234" y="42" width="146" height="166" rx="6" fill="url(#duskWin)" opacity="0.6" />
      <defs>
        <linearGradient id="duskWin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE3B0" />
          <stop offset="100%" stopColor="#F6C98F" />
        </linearGradient>
      </defs>
      {/* 床のライン */}
      <line x1="0" y1="250" x2="420" y2="250" stroke="#E8CFA4" strokeWidth="2" opacity="0.5" />
      {/* ランプ（左） */}
      <line x1="60" y1="120" x2="60" y2="250" stroke="#D9B888" strokeWidth="3" />
      <path d="M38 120 L82 120 L74 86 L46 86 Z" fill="#F4D399" stroke="#E2BC84" strokeWidth="1.5" />
      <circle cx="60" cy="118" r="26" fill="#FFE9BC" opacity="0.5" />
    </svg>
  );
}

// ── 自分という存在が「灯っていく」肖像 ──────────────
// lit = 0..1 で、どれだけ自分が照らされたか
function SelfPortrait({ lit = 0.4, size = 132 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="spGlow" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor="#FFE2A6" />
          <stop offset="60%" stopColor="#F2C172" />
          <stop offset="100%" stopColor="#E7AE5C" />
        </radialGradient>
        <clipPath id="spClip">
          {/* やわらかい人型のシルエット */}
          <path d="M60 18 C70 18 77 26 77 36 C77 44 72 50 66 52 C80 55 90 66 92 84 C93 95 88 102 78 102 L42 102 C32 102 27 95 28 84 C30 66 40 55 54 52 C48 50 43 44 43 36 C43 26 50 18 60 18Z" />
        </clipPath>
      </defs>
      {/* 暗いシルエット（まだ照らされていない自分） */}
      <g clipPath="url(#spClip)">
        <rect x="0" y="0" width="120" height="120" fill="#D8C7B2" />
        {/* 下から灯りが満ちていく */}
        <rect x="0" y={120 - 120 * lit} width="120" height={120 * lit} fill="url(#spGlow)" />
      </g>
      {/* 輪郭線 */}
      <path d="M60 18 C70 18 77 26 77 36 C77 44 72 50 66 52 C80 55 90 66 92 84 C93 95 88 102 78 102 L42 102 C32 102 27 95 28 84 C30 66 40 55 54 52 C48 50 43 44 43 36 C43 26 50 18 60 18Z"
        fill="none" stroke="#C8A877" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

const JP = '-apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif';

// 時間帯であかりのひとことを変える
function greetingFor(hour) {
  if (hour >= 0 && hour < 5) return { sub: "深夜", line: "こんな時間に、おかえりなさい。私もまだ起きてました。", slow: true };
  if (hour < 11) return { sub: "朝", line: "おはようございます。今日が、はじまりますね。", slow: false };
  if (hour < 17) return { sub: "昼", line: "おかえりなさい。今日は、どんな感じですか。", slow: false };
  if (hour < 22) return { sub: "夜", line: "おかえりなさい。今日も、おつかれさまでした。", slow: false };
  return { sub: "夜ふけ", line: "おかえりなさい。ゆっくりして、いいですよ。", slow: true };
}

export default function Home() {
  const hour = new Date().getHours();
  const greet = greetingFor(hour);

  // モックの自分データ
  const [lit] = useState(0.42);          // 自分がどれだけ灯ったか
  const litPct = Math.round(lit * 100);

  return (
    <div style={s.frame}>
      <style>{`
        @keyframes hglow { 0%,100%{opacity:.85} 50%{opacity:1} }
        @keyframes hrise { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .hcard{ animation:hrise .5s ease both; }
        .htap{ cursor:pointer; transition:transform .12s ease, box-shadow .2s ease; }
        .htap:active{ transform:scale(.985); }
      `}</style>

      {/* 部屋の背景（画像 or 仮のSVG） */}
      <RoomBackdrop />

      {/* 部屋を満たす、あたたかい光 */}
      <div style={s.roomGlow} />

      <div style={s.scroll}>
        {/* あかり：迎える人（脇役・上） */}
        <div className="hcard" style={{ ...s.greetRow, animationDelay: "0ms" }}>
          <div style={s.akWrap}>
            <div style={s.akHalo} />
            <Akari size={50} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.greetSub}>{greet.sub} ・ あかり</div>
            <div style={s.greetLine}>{greet.line}</div>
          </div>
        </div>

        {/* 主役：自分 */}
        <div style={s.eyebrow}>あなた</div>

        {/* 自分が灯っていく、肖像カード */}
        <div className="hcard htap" style={{ ...s.selfCard, animationDelay: "70ms" }}>
          <SelfPortrait lit={lit} size={128} />
          <div style={{ flex: 1 }}>
            <div style={s.selfTitle}>あなたという人が、<br />すこしずつ灯っています</div>
            <div style={s.litBarWrap}>
              <div style={{ ...s.litBar, width: `${litPct}%` }} />
            </div>
            <div style={s.litMeta}>{litPct}% ・ 今日、ひとつ灯りがふえました</div>
          </div>
        </div>

        {/* 自分の小カード2つ */}
        <div style={s.dualRow}>
          <div className="hcard htap" style={{ ...s.miniCard, animationDelay: "130ms" }}>
            <div style={s.miniIcon}>🕯️</div>
            <div style={s.miniTitle}>これまで</div>
            <div style={s.miniSub}>話したこと・綴ったこと</div>
          </div>
          <div className="hcard htap" style={{ ...s.miniCard, animationDelay: "180ms" }}>
            <div style={s.miniIcon}>🧭</div>
            <div style={s.miniTitle}>傾向</div>
            <div style={s.miniSub}>今、見えていること</div>
          </div>
        </div>

        {/* 次の一歩 */}
        <div style={s.eyebrow}>つぎの一歩</div>
        <div className="hcard htap" style={{ ...s.talkBtn, animationDelay: "230ms" }}>
          <Akari size={34} />
          <div style={{ flex: 1 }}>
            <div style={s.talkTitle}>あかりと話す</div>
            <div style={s.talkSub}>今日のことでも、なんでも</div>
          </div>
          <div style={s.arrow}>→</div>
        </div>
        <div className="hcard htap" style={{ ...s.communityBtn, animationDelay: "280ms" }}>
          <div style={s.commIcon}>🤍</div>
          <div style={{ flex: 1 }}>
            <div style={s.commTitle}>みんなのところへ</div>
            <div style={s.commSub}>ほかの人と、すこし</div>
          </div>
          <div style={{ ...s.arrow, color: "#B89A6F" }}>→</div>
        </div>

        {/* 部屋／着せ替え（静かに） */}
        <div className="hcard htap" style={{ ...s.shelf, animationDelay: "330ms" }}>
          <span style={s.shelfLabel}>部屋をととのえる</span>
          <span style={s.shelfItems}>🪴　🕯️　🫖　＋</span>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

const s = {
  frame: {
    position: "relative", height: "100vh", maxWidth: 420, margin: "0 auto",
    fontFamily: JP, color: "#3B2E24", overflow: "hidden",
    background: "linear-gradient(180deg, #FDF1DA 0%, #F8E4C5 55%, #F4DBB6 100%)",
  },
  roomGlow: {
    position: "absolute", top: -90, left: "8%", width: 300, height: 300, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,233,188,0.95) 0%, rgba(255,233,188,0) 70%)",
    animation: "hglow 6s ease-in-out infinite", pointerEvents: "none",
  },
  scroll: {
    position: "relative", zIndex: 1, height: "100%", overflowY: "auto",
    padding: "26px 18px calc(20px + env(safe-area-inset-bottom))",
  },

  greetRow: { display: "flex", alignItems: "center", gap: 13, marginBottom: 26 },
  akWrap: { position: "relative", width: 50, height: 50, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  akHalo: {
    position: "absolute", width: 74, height: 74, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,224,170,0.85) 0%, rgba(255,224,170,0) 70%)",
  },
  greetSub: { fontSize: 11, letterSpacing: "0.14em", color: "#B08A57", fontWeight: 700, marginBottom: 3 },
  greetLine: { fontSize: 15, lineHeight: 1.6, color: "#4A3A2C", fontWeight: 500 },

  eyebrow: { fontSize: 11, letterSpacing: "0.2em", color: "#B6986C", fontWeight: 700, margin: "4px 2px 11px" },

  selfCard: {
    display: "flex", alignItems: "center", gap: 14, padding: "16px 16px",
    background: "#FFFDF8", borderRadius: 22, marginBottom: 16,
    boxShadow: "0 6px 22px rgba(196,150,86,0.18)", border: "1px solid #F4E7CE",
  },
  selfTitle: { fontSize: 15.5, lineHeight: 1.5, fontWeight: 700, color: "#42342A", marginBottom: 11 },
  litBarWrap: { height: 7, borderRadius: 4, background: "#EDE0CA", overflow: "hidden", marginBottom: 7 },
  litBar: { height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #F3C775, #E79A4C)" },
  litMeta: { fontSize: 11.5, color: "#A98A5F", letterSpacing: "0.01em" },

  dualRow: { display: "flex", gap: 11, marginBottom: 22 },
  miniCard: {
    flex: 1, padding: "15px 14px", background: "#FFFDF8", borderRadius: 18,
    boxShadow: "0 4px 16px rgba(196,150,86,0.13)", border: "1px solid #F4E7CE",
  },
  miniIcon: { fontSize: 21, marginBottom: 8 },
  miniTitle: { fontSize: 14.5, fontWeight: 700, color: "#42342A", marginBottom: 3 },
  miniSub: { fontSize: 11.5, color: "#A98A5F", lineHeight: 1.4 },

  talkBtn: {
    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
    background: "linear-gradient(120deg, #F7D9A6, #F1C580)", borderRadius: 20, marginBottom: 11,
    boxShadow: "0 6px 18px rgba(225,165,90,0.3)",
  },
  talkTitle: { fontSize: 15.5, fontWeight: 700, color: "#4A3520" },
  talkSub: { fontSize: 12, color: "#86663C", marginTop: 2 },
  arrow: { fontSize: 19, color: "#9A6E3A", fontWeight: 700 },

  communityBtn: {
    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
    background: "#FFFDF8", borderRadius: 20, marginBottom: 22,
    boxShadow: "0 4px 16px rgba(196,150,86,0.12)", border: "1px solid #F4E7CE",
  },
  commIcon: { fontSize: 20, width: 34, textAlign: "center" },
  commTitle: { fontSize: 15, fontWeight: 700, color: "#42342A" },
  commSub: { fontSize: 12, color: "#A98A5F", marginTop: 2 },

  shelf: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "13px 18px", background: "rgba(255,253,248,0.6)", borderRadius: 16,
    border: "1px dashed #E4CFA8",
  },
  shelfLabel: { fontSize: 12.5, color: "#A98A5F", fontWeight: 600 },
  shelfItems: { fontSize: 17, letterSpacing: "0.12em" },
};

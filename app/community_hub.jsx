import React, { useState, useEffect, useRef } from "react";

const GOTHIC = '-apple-system, "Hiragino Sans", "Noto Sans JP", Meiryo, sans-serif';
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';

const SOURCES = {
  talk:   { label: "あかりとの会話", icon: "🕯", tint: "#EAC77E" },
  zukan:  { label: "図鑑",         icon: "🔥", tint: "#E8A36A" },
  thanks: { label: "あたたかい木",  icon: "🌿", tint: "#A9C68C" },
};

// near＝暖色の泡、far＝寒色の泡。同じ水の中に混ぜる
const BUBBLES = [
  { id: 1, kind: "near", who: "ゆう", from: "talk", text: "自分は『勝ちたい』んじゃなくて、ただ『没頭したい』だけだって気づいた。", temp: "すっきり", received: 4, size: 156, x: 16, y: 8, dur: 7.5, delay: 0 },
  { id: 2, kind: "near", who: "あなた", from: "zukan", text: "『急かされると消耗する』が灯った。ずっと、自分が怠けてるんだと思ってた。", temp: "ほっとした", received: 6, mine: true, size: 168, x: 52, y: 30, dur: 8.5, delay: 1.2 },
  { id: 3, kind: "near", who: "みなと", from: "thanks", text: "母が、黙ってそばにいてくれたこと。", temp: "あたたかい", received: 9, size: 132, x: 8, y: 46, dur: 6.8, delay: 0.6 },
  { id: 4, kind: "far", text: "いま、世界で 2,847 人が、自分と向き合っています", size: 150, x: 50, y: 60, dur: 9, delay: 0.3, far: true },
  { id: 5, kind: "near", who: "さき", from: "talk", text: "『本当の自分を探さなくていい』って言われて、肩の力が抜けた。", temp: "軽くなった", received: 5, size: 144, x: 20, y: 72, dur: 7.8, delay: 1.8 },
  { id: 6, kind: "far", text: "遠くの誰か——「焦らなくていい、と自分に言えた日」", size: 134, x: 58, y: 88, dur: 8.2, delay: 0.9, far: true },
  { id: 7, kind: "near", who: "りく", from: "zukan", text: "『一人で充電するタイプ』だと分かって、断る罪悪感が減った。", temp: "楽になった", received: 7, size: 138, x: 12, y: 104, dur: 7.2, delay: 0.4 },
  { id: 8, kind: "far", text: "同じ「人との距離」に向き合う人が、今日 312 人", size: 128, x: 56, y: 116, dur: 8.8, delay: 1.5, far: true },
];

export default function CommunityHub() {
  const [open, setOpen] = useState(null);
  const [composing, setComposing] = useState(false);
  const [got, setGot] = useState({});

  const openB = BUBBLES.find((b) => b.id === open);

  return (
    <div style={s.frame}>
      <style>{`
        @keyframes drift1{0%{transform:translate(0,0)}25%{transform:translate(7px,-10px)}50%{transform:translate(-5px,-18px)}75%{transform:translate(-9px,-8px)}100%{transform:translate(0,0)}}
        @keyframes drift2{0%{transform:translate(0,0)}33%{transform:translate(-8px,-12px)}66%{transform:translate(9px,-7px)}100%{transform:translate(0,0)}}
        @keyframes shimmer{0%,100%{opacity:.85}50%{opacity:1}}
        @keyframes popIn{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:scale(1)}}
        @keyframes sheetUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
        .bub{animation:popIn .6s cubic-bezier(.2,.8,.3,1) both}
        .float{cursor:pointer}
        .sheet{animation:sheetUp .3s cubic-bezier(.2,.7,.2,1) both}
        .tap:active{transform:scale(.97)}
        .water::-webkit-scrollbar{display:none}
      `}</style>

      {/* ヘッダー */}
      <div style={s.head}>
        <div>
          <div style={s.kicker}>みんなのところ</div>
          <div style={s.lede}>誰かの、人生のかけら。</div>
        </div>
        <div style={s.hikari}>☀️</div>
      </div>
      <div style={s.subtle}>近くの声も、遠くの気配も、同じ水のなかに漂っています</div>

      {/* 水の中（泡が漂う） */}
      <div className="water" style={s.water}>
        <div style={{ position: "relative", height: 1180, width: "100%" }}>
          {BUBBLES.map((b, i) => {
            const src = b.far ? null : SOURCES[b.from];
            const isGot = got[b.id];
            return (
              <div key={b.id} className="bub float"
                onClick={() => setOpen(b.id)}
                style={{
                  position: "absolute", left: `${b.x}%`, top: b.y * 9.5,
                  width: b.size, height: b.size, animationDelay: `${b.delay}s`,
                }}>
                <div style={{ width: "100%", height: "100%", animation: `${i % 2 ? "drift2" : "drift1"} ${b.dur}s ease-in-out infinite`, animationDelay: `${b.delay}s` }}>
                  <div style={{
                    ...s.bubble,
                    ...(b.far ? s.bubbleFar : s.bubbleNear),
                    ...(b.mine ? s.bubbleMine : {}),
                    animation: "shimmer 5s ease-in-out infinite", animationDelay: `${b.delay}s`,
                  }}>
                    <div style={s.bubbleInner}>
                      {src && <div style={{ ...s.miniSrc, background: src.tint }}>{src.icon}</div>}
                      <div style={{ ...s.bubText, fontSize: b.size > 150 ? 13 : 11.5, color: b.far ? "#54616E" : "#46382B" }}>
                        {b.text.length > 38 ? b.text.slice(0, 36) + "…" : b.text}
                      </div>
                      {!b.far && <div style={s.bubTemp}>{b.temp}{isGot ? " · 🤍" : ""}</div>}
                    </div>
                    {/* 泡のハイライト */}
                    <span style={s.gloss} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="tap" style={s.fab} onClick={() => setComposing(true)}>＋ 自分のかけらを置く</button>

      {/* 泡をひらく */}
      {openB && (
        <div style={s.backdrop} onClick={() => setOpen(null)}>
          <div className="sheet" style={s.card} onClick={(e) => e.stopPropagation()}>
            {openB.far ? (
              <>
                <div style={s.farTag}>遠くの気配</div>
                <div style={s.cardTextMincho}>{openB.text}</div>
                <div style={s.farHint}>つながらなくていい。ただ、一人じゃないと、感じるための場所。</div>
              </>
            ) : (
              <>
                <div style={{ ...s.srcChip, background: SOURCES[openB.from].tint }}>
                  {SOURCES[openB.from].icon} {SOURCES[openB.from].label}より · {openB.mine ? "あなた" : openB.who}
                </div>
                <div style={s.cardTextMincho}>{openB.text}</div>
                <div style={s.cardTemp}>「{openB.temp}」</div>
                <button className="tap" style={{ ...s.receive, ...(got[openB.id] ? s.receiveOn : {}) }}
                  onClick={() => setGot((g) => ({ ...g, [openB.id]: !g[openB.id] }))}>
                  🤍 受け取{got[openB.id] ? "った" : "る"} · {openB.received + (got[openB.id] ? 1 : 0)}
                </button>
              </>
            )}
            <button style={s.close} onClick={() => setOpen(null)}>とじる</button>
          </div>
        </div>
      )}

      {/* 置く */}
      {composing && (
        <div style={s.backdrop} onClick={() => setComposing(false)}>
          <div className="sheet" style={s.compose} onClick={(e) => e.stopPropagation()}>
            <div style={s.composeTitle}>どこから、持ってくる?</div>
            <div style={s.composeHint}>あなたの中で見えたことを、そっと放てます</div>
            {Object.entries(SOURCES).map(([k, v]) => (
              <button key={k} className="tap" style={s.sourceRow} onClick={() => setComposing(false)}>
                <span style={{ ...s.sourceIcon, background: v.tint }}>{v.icon}</span>
                <span style={s.sourceLabel}>{v.label} から</span>
                <span style={s.sourceArrow}>→</span>
              </button>
            ))}
            <div style={s.footnote}>これから増える場所も、ここに並びます</div>
            <button style={s.close} onClick={() => setComposing(false)}>とじる</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  frame: { height: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: GOTHIC, color: "#3A2E25", position: "relative", overflow: "hidden",
    background: "radial-gradient(130% 80% at 50% 0%, #FFF6E4 0%, #F6E7CC 45%, #EFE0D6 75%, #E6DEE6 100%)" },

  head: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "24px 22px 4px" },
  kicker: { fontSize: 11, letterSpacing: "0.22em", color: "#C09A5E", fontWeight: 700 },
  lede: { fontSize: 23, fontFamily: MINCHO, fontWeight: 600, color: "#4A3826", marginTop: 7 },
  hikari: { width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%,#FFE9A8,#F4C45A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 2px 10px rgba(230,180,80,0.45)" },
  subtle: { fontSize: 11, color: "#B49A70", padding: "6px 22px 0", fontFamily: MINCHO },

  water: { position: "absolute", top: 110, left: 0, right: 0, bottom: 0, overflowY: "auto", padding: "10px 0" },

  bubble: { position: "relative", width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  bubbleNear: { background: "radial-gradient(circle at 36% 30%, rgba(255,251,240,0.95), rgba(248,224,186,0.78) 60%, rgba(241,205,150,0.6))", boxShadow: "0 12px 30px -10px rgba(200,150,80,0.5), inset 0 0 22px rgba(255,255,255,0.5)" },
  bubbleFar: { background: "radial-gradient(circle at 36% 30%, rgba(245,250,255,0.95), rgba(206,226,244,0.72) 60%, rgba(176,205,232,0.55))", boxShadow: "0 12px 30px -10px rgba(120,160,200,0.45), inset 0 0 22px rgba(255,255,255,0.55)" },
  bubbleMine: { boxShadow: "0 12px 32px -8px rgba(225,165,75,0.65), inset 0 0 22px rgba(255,255,255,0.6)", outline: "1.5px solid rgba(235,185,105,0.7)" },
  bubbleInner: { textAlign: "center", padding: "0 18px", zIndex: 2 },
  miniSrc: { width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, margin: "0 auto 6px" },
  bubText: { fontFamily: MINCHO, lineHeight: 1.65, fontWeight: 500 },
  bubTemp: { fontFamily: MINCHO, fontSize: 10.5, color: "#C0823E", fontStyle: "italic", marginTop: 6 },
  gloss: { position: "absolute", top: "12%", left: "20%", width: "34%", height: "24%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.85), transparent 70%)", filter: "blur(1px)" },

  fab: { position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "calc(20px + env(safe-area-inset-bottom))", zIndex: 5,
    background: "linear-gradient(135deg,#F3BC64,#E79949)", color: "#fff", border: "none", borderRadius: 26, padding: "13px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: GOTHIC, boxShadow: "0 8px 22px -6px rgba(225,150,70,0.6)" },

  backdrop: { position: "fixed", inset: 0, background: "rgba(55,38,22,0.32)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 20 },
  card: { background: "#FFFDF8", width: "100%", maxWidth: 430, borderRadius: "24px 24px 0 0", padding: "24px 22px calc(20px + env(safe-area-inset-bottom))", textAlign: "center", boxShadow: "0 -8px 30px rgba(150,110,60,0.28)" },
  srcChip: { display: "inline-block", fontSize: 11, fontWeight: 700, color: "#6B4F33", borderRadius: 20, padding: "4px 13px", marginBottom: 14 },
  farTag: { display: "inline-block", fontSize: 11, fontWeight: 700, color: "#5E7C96", background: "#E5EFF7", borderRadius: 20, padding: "4px 13px", marginBottom: 14 },
  cardTextMincho: { fontFamily: MINCHO, fontSize: 17, lineHeight: 1.9, color: "#3F3328" },
  cardTemp: { fontFamily: MINCHO, fontSize: 14, color: "#C0823E", fontStyle: "italic", margin: "12px 0 4px" },
  farHint: { fontFamily: MINCHO, fontSize: 12.5, color: "#7E8C98", marginTop: 14, lineHeight: 1.7 },
  receive: { marginTop: 16, background: "rgba(238,243,230,0.9)", color: "#7C9869", border: "none", borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: GOTHIC },
  receiveOn: { background: "rgba(218,235,203,0.95)", color: "#5C7A4A" },
  close: { display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#A98A5F", fontSize: 13, cursor: "pointer", fontFamily: GOTHIC },

  compose: { background: "#FFFDF8", width: "100%", maxWidth: 430, borderRadius: "24px 24px 0 0", padding: "22px 20px calc(18px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 30px rgba(150,110,60,0.28)" },
  composeTitle: { fontFamily: MINCHO, fontSize: 17, fontWeight: 700, color: "#42342A", textAlign: "center" },
  composeHint: { fontSize: 11.5, color: "#A98A5F", textAlign: "center", margin: "5px 0 16px" },
  sourceRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", border: "none", background: "rgba(251,241,222,0.7)", borderRadius: 15, padding: "13px 15px", marginBottom: 9, cursor: "pointer", fontFamily: GOTHIC },
  sourceIcon: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 },
  sourceLabel: { fontSize: 14, fontWeight: 700, color: "#5C4630", flex: 1, textAlign: "left" },
  sourceArrow: { fontSize: 15, color: "#B98A4A", fontWeight: 700 },
  footnote: { fontSize: 10.5, color: "#B0985F", textAlign: "center", marginTop: 6 },
};

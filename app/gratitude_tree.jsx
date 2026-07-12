import React, { useState, useMemo } from "react";

const JP = '-apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif';

// もらった＝honey、あげた＝rosy
const KIND = {
  received: { label: "もらった", color: "#F0B45C", glow: "rgba(240,180,92,0.55)" },
  given:    { label: "あげた",   color: "#E58E78", glow: "rgba(229,142,120,0.5)" },
};

// 大切な人＝枝。tip＝実の集まる位置
const PEOPLE = [
  { id: "haha", name: "お母さん", icon: "🌷", tip: [86, 150], branch: "M180,300 Q120,250 86,160" },
  { id: "yuu",  name: "ゆう（親友）", icon: "🦊", tip: [286, 140], branch: "M180,290 Q250,230 286,150" },
  { id: "doryo", name: "同僚のK", icon: "🐢", tip: [72, 252], branch: "M180,330 Q110,300 72,260" },
  { id: "aite", name: "パートナー", icon: "🐰", tip: [296, 248], branch: "M180,320 Q255,300 296,256" },
];

const INIT_FRUITS = [
  { person: "haha", kind: "received", temp: "ありがたい", word: "心配して、電話くれた" },
  { person: "haha", kind: "given", temp: "うれしい", word: "誕生日、何もない日に贈り物した" },
  { person: "yuu", kind: "received", temp: "救われた", word: "しんどい時、ただ聞いてくれた" },
  { person: "yuu", kind: "given", temp: "たのしい", word: "落ち込んでた時、一緒に笑った" },
  { person: "yuu", kind: "received", temp: "ほっとした", word: "「焦らなくていい」と言ってくれた" },
  { person: "doryo", kind: "given", temp: "やくに立てた", word: "資料、代わりに作った" },
  { person: "aite", kind: "received", temp: "あたたかい", word: "黙って、そばにいてくれた" },
  { person: "aite", kind: "given", temp: "いとおしい", word: "好きなごはん、作った" },
];

const TEMPS = ["ありがたい", "うれしい", "救われた", "ほっとした", "あたたかい", "申し訳ない", "やくに立てた", "いとおしい"];

export default function GratitudeTree() {
  const [fruits, setFruits] = useState(INIT_FRUITS);
  const [sel, setSel] = useState(null);        // 選んだ実
  const [highlight, setHighlight] = useState(null); // あかりが思い出させた実のindex
  const [adding, setAdding] = useState(false);

  // 実の座標：人ごとに tip 周りへ小さく散らす
  const placed = useMemo(() => {
    const byPerson = {};
    return fruits.map((f, i) => {
      const p = PEOPLE.find((x) => x.id === f.person);
      const n = (byPerson[f.person] = (byPerson[f.person] || 0) + 1) - 1;
      const ang = (n * 2.399) % (Math.PI * 2);       // 黄金角でばらけさせる
      const rad = 14 + (n % 3) * 11;
      return { ...f, i, x: p.tip[0] + Math.cos(ang) * rad, y: p.tip[1] + Math.sin(ang) * rad };
    });
  }, [fruits]);

  const recall = () => {
    if (!fruits.length) return;
    const idx = Math.floor(Math.random() * fruits.length);
    setHighlight(idx);
    setSel({ ...placed[idx], recalled: true });
  };

  const total = fruits.length;
  const people = new Set(fruits.map((f) => f.person)).size;

  return (
    <div style={s.frame}>
      <style>{`
        @keyframes glow{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sheet{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fruit{cursor:pointer;transform-origin:center}
        .fruit:active{transform:scale(.9)}
        .sheet{animation:sheet .25s ease both}
        .rise{animation:rise .4s ease both}
      `}</style>

      {/* ヘッダー */}
      <div style={s.head}>
        <div style={s.title}>あたたかい木</div>
        <div style={s.sub}>あなたが、人と交わしてきた、あたたかいこと</div>
      </div>

      {/* 木 */}
      <div style={s.treeWrap}>
        <svg viewBox="0 0 360 420" style={{ width: "100%", display: "block" }}>
          <defs>
            <radialGradient id="sky" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#FFF3DA" />
              <stop offset="100%" stopColor="#F6E3C6" />
            </radialGradient>
            <linearGradient id="bark" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#6B4A33" />
              <stop offset="100%" stopColor="#8A6244" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="360" height="420" fill="url(#sky)" />
          {/* やわらかい地面の光 */}
          <ellipse cx="180" cy="392" rx="120" ry="20" fill="rgba(240,200,130,0.35)" />

          {/* 幹 */}
          <path d="M168,398 Q172,310 176,250 Q178,230 180,215 Q182,230 184,250 Q188,310 192,398 Z" fill="url(#bark)" />
          {/* 枝 */}
          {PEOPLE.map((p) => (
            <path key={p.id} d={p.branch} fill="none" stroke="url(#bark)" strokeWidth="6" strokeLinecap="round" opacity="0.92" />
          ))}
          {/* これからの芽（空き枝） */}
          <path d="M180,270 Q180,235 180,205" fill="none" stroke="#C8AE88" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 7" />
          <circle cx="180" cy="200" r="5" fill="none" stroke="#C8AE88" strokeWidth="1.5" />

          {/* 人の名札 */}
          {PEOPLE.map((p) => (
            <g key={p.id}>
              <circle cx={p.tip[0]} cy={p.tip[1] - 30} r="15" fill="#FFFDF8" stroke="#EAD6B0" strokeWidth="1.5" />
              <text x={p.tip[0]} y={p.tip[1] - 30} textAnchor="middle" dominantBaseline="central" fontSize="15">{p.icon}</text>
              <text x={p.tip[0]} y={p.tip[1] - 48} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#6B4F33" fontFamily={JP}>{p.name}</text>
            </g>
          ))}

          {/* 実（あったかいこと） */}
          {placed.map((f) => {
            const k = KIND[f.kind];
            const hot = highlight === f.i;
            return (
              <g key={f.i} className="fruit" onClick={() => { setSel(f); setHighlight(null); }}>
                <circle cx={f.x} cy={f.y} r={hot ? 13 : 9} fill={k.glow} style={{ animation: "glow 3s ease-in-out infinite", animationDelay: `${(f.i % 5) * 0.4}s` }} />
                <circle cx={f.x} cy={f.y} r={hot ? 7 : 5.5} fill={k.color}
                  stroke="#fff" strokeWidth={hot ? 2 : 1} />
              </g>
            );
          })}
        </svg>

        {/* あかり（根元） */}
        <div style={s.akari}>
          <span style={s.akariFace}>🕯</span>
          <button style={s.recallBtn} onClick={recall}>あかりに、ひとつ思い出させてもらう</button>
        </div>
      </div>

      {/* 凡例＋集計 */}
      <div style={s.legendRow}>
        <span style={s.legend}><span style={{ ...s.dot, background: KIND.received.color }} />もらった</span>
        <span style={s.legend}><span style={{ ...s.dot, background: KIND.given.color }} />あげた</span>
        <span style={s.count}>{people}人と・{total}のあたたかいこと</span>
      </div>

      {/* 追加ボタン */}
      <button style={s.addBtn} onClick={() => setAdding(true)}>＋ あったかいこと</button>

      {/* 実の詳細 */}
      {sel && (
        <div style={s.backdrop} onClick={() => setSel(null)}>
          <div className="sheet" style={s.card} onClick={(e) => e.stopPropagation()}>
            {sel.recalled && <div style={s.recallTag}>🕯 あかり「そういえば、前に、こんなことがありましたね」</div>}
            <div style={{ ...s.kindTag, background: KIND[sel.kind].color }}>{KIND[sel.kind].label}</div>
            <div style={s.cardWho}>{PEOPLE.find((p) => p.id === sel.person)?.icon} {PEOPLE.find((p) => p.id === sel.person)?.name}</div>
            <div style={s.cardTemp}>「{sel.temp}」</div>
            {sel.word && <div style={s.cardWord}>{sel.word}</div>}
            <button style={s.close} onClick={() => setSel(null)}>とじる</button>
          </div>
        </div>
      )}

      {/* 追加（書かせない：顔→温度→任意ひとこと） */}
      {adding && <AddSheet onClose={() => setAdding(false)} onSave={(f) => { setFruits((p) => [...p, f]); setAdding(false); }} />}
    </div>
  );
}

function AddSheet({ onClose, onSave }) {
  const [person, setPerson] = useState(null);
  const [kind, setKind] = useState(null);
  const [temp, setTemp] = useState(null);
  const [word, setWord] = useState("");
  const ready = person && kind && temp;
  return (
    <div style={s.backdrop} onClick={onClose}>
      <div className="sheet" style={s.addCard} onClick={(e) => e.stopPropagation()}>
        <div style={s.addTitle}>あったかいこと</div>

        <div style={s.addLabel}>だれと</div>
        <div style={s.chipRow}>
          {PEOPLE.map((p) => (
            <button key={p.id} style={{ ...s.chip, ...(person === p.id ? s.chipOn : {}) }} onClick={() => setPerson(p.id)}>{p.icon} {p.name}</button>
          ))}
        </div>

        <div style={s.addLabel}>どっち</div>
        <div style={s.chipRow}>
          <button style={{ ...s.chip, ...(kind === "received" ? s.chipOn : {}) }} onClick={() => setKind("received")}>もらった</button>
          <button style={{ ...s.chip, ...(kind === "given" ? s.chipOn : {}) }} onClick={() => setKind("given")}>あげた</button>
        </div>

        <div style={s.addLabel}>どんな気持ち</div>
        <div style={s.chipRow}>
          {TEMPS.map((t) => (
            <button key={t} style={{ ...s.chip, ...(temp === t ? s.chipOn : {}) }} onClick={() => setTemp(t)}>{t}</button>
          ))}
        </div>

        <div style={s.addLabel}>ひとこと（書かなくていい）</div>
        <input style={s.input} value={word} onChange={(e) => setWord(e.target.value)} placeholder="…" />

        <button style={{ ...s.saveBtn, opacity: ready ? 1 : 0.4 }} disabled={!ready}
          onClick={() => onSave({ person, kind, temp, word })}>のこす</button>
        <button style={s.close} onClick={onClose}>やめる</button>
      </div>
    </div>
  );
}

const s = {
  frame: { minHeight: "100vh", maxWidth: 420, margin: "0 auto", fontFamily: JP, color: "#3B2E24",
    background: "linear-gradient(180deg,#FBF0DD 0%,#F6E3C6 100%)", paddingBottom: 30 },
  head: { padding: "22px 20px 6px" },
  title: { fontSize: 21, fontWeight: 800, letterSpacing: "0.04em" },
  sub: { fontSize: 12.5, color: "#A98A5F", marginTop: 4 },

  treeWrap: { position: "relative", padding: "0 6px" },
  akari: { display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: -6 },
  akariFace: { fontSize: 20 },
  recallBtn: { fontSize: 12, color: "#9A5A2E", background: "#FBE7CE", border: "none", borderRadius: 20, padding: "8px 14px", cursor: "pointer", fontFamily: JP },

  legendRow: { display: "flex", alignItems: "center", gap: 14, justifyContent: "center", margin: "14px 0 4px", flexWrap: "wrap" },
  legend: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B4F33" },
  dot: { width: 11, height: 11, borderRadius: "50%", display: "inline-block" },
  count: { fontSize: 11.5, color: "#A98A5F" },

  addBtn: { display: "block", margin: "12px auto 0", background: "linear-gradient(135deg,#F2B860,#E89B4C)", color: "#fff",
    border: "none", borderRadius: 22, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: JP, boxShadow: "0 4px 14px rgba(225,150,70,0.4)" },

  backdrop: { position: "fixed", inset: 0, background: "rgba(60,40,25,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 10 },
  card: { background: "#FFFDF8", width: "100%", maxWidth: 420, borderRadius: "22px 22px 0 0", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", textAlign: "center", boxShadow: "0 -6px 24px rgba(150,110,60,0.25)" },
  recallTag: { fontSize: 12, color: "#9A5A2E", background: "#FBE7CE", borderRadius: 12, padding: "8px 12px", marginBottom: 14, lineHeight: 1.5 },
  kindTag: { display: "inline-block", fontSize: 11, fontWeight: 800, color: "#fff", borderRadius: 20, padding: "3px 12px", marginBottom: 12 },
  cardWho: { fontSize: 16, fontWeight: 800, color: "#42342A" },
  cardTemp: { fontSize: 15, color: "#C07A3A", fontWeight: 700, margin: "6px 0" },
  cardWord: { fontSize: 14, color: "#5C4A34", lineHeight: 1.6, marginTop: 4 },
  close: { display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#A98A5F", fontSize: 13, cursor: "pointer", fontFamily: JP },

  addCard: { background: "#FFFDF8", width: "100%", maxWidth: 420, borderRadius: "22px 22px 0 0", padding: "20px 20px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -6px 24px rgba(150,110,60,0.25)", maxHeight: "88vh", overflowY: "auto" },
  addTitle: { fontSize: 17, fontWeight: 800, color: "#42342A", textAlign: "center", marginBottom: 14 },
  addLabel: { fontSize: 12, fontWeight: 700, color: "#B0915F", margin: "12px 0 7px" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { fontSize: 13, color: "#6B4F33", background: "#FBF1DE", border: "1.5px solid transparent", borderRadius: 18, padding: "8px 13px", cursor: "pointer", fontFamily: JP },
  chipOn: { background: "#FFE6BE", border: "1.5px solid #E8A85C", fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #E6D8C2", borderRadius: 12, padding: "11px 13px", fontSize: 14, fontFamily: JP, background: "#FBF6EE", color: "#2E2A26" },
  saveBtn: { display: "block", width: "100%", marginTop: 16, background: "linear-gradient(135deg,#F2B860,#E89B4C)", color: "#fff", border: "none", borderRadius: 16, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: JP },
};

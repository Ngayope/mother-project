import React, { useState } from "react";

const JP = '-apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif';

const SRC = {
  self:   { mark: "✎", label: "自分", color: "#C98A3C" },
  akari:  { mark: "🕯", label: "あかり", color: "#D9803F" },
  friend: { mark: "🤍", label: "友達", color: "#7F9A6E" },
};
const ICONS = ["🦊", "🐻", "🐢", "🦉", "🐱", "🐰", "🦁", "🐧", "🌿", "🔥", "💧", "⭐"];

// ── ステータス＝ビッグファイブ5軸（層1・性格） ──
// lit: 灯ったか。val: 0..1
const BIG5 = [
  { key: "ひらめき", val: 0.7, lit: true },   // 開放性
  { key: "こつこつ", val: 0.5, lit: true },   // 誠実性
  { key: "にぎやか", val: 0.6, lit: true },   // 外向性
  { key: "おもいやり", val: 0.8, lit: true },  // 協調性
  { key: "おだやか", val: 0.0, lit: false },  // 情緒の安定（まだ）
];

// ── 項目（層2・3。対応表どおり） ──
const ENTRIES = [
  { id: "ability", cat: "とくせい", icon: "✦", lit: true, by: "akari", depth: 0.8,
    main: "人といて充電タイプ",
    self: "", akari: "人と一緒に何かを作っている時、いちばん満ちている", friend: "一緒にいると場が動く" },
  { id: "hidden", cat: "かくれとくせい", icon: "✧", lit: false },
  { id: "nature", cat: "せいかく", icon: "❀", lit: true, by: "self", depth: 0.5,
    main: "狭く深く・感覚で決める",
    self: "少人数と深く。決める時は感覚", akari: "理屈より、しっくりくるかで選んでいた", friend: "" },
  { id: "item", cat: "もちもの（たいせつなもの）", icon: "🎒", lit: true, by: "self", depth: 0.7,
    main: "正直さ／人とのつながり",
    self: "正直さ／人とのつながり", akari: "「うそをつかない」を何度も口にしていた", friend: "" },
  { id: "moves", cat: "おぼえているわざ", icon: "⚔", lit: true, by: "akari", depth: 0.9,
    main: "協働クラフト ／ 段取りづくり",
    self: "段取りを組む", akari: "「協働クラフト」仲間と一つのものを組み上げる", friend: "場の段取りを作るのがうまい",
    moves: ["協働クラフト（みんなで一つを作る）", "段取りづくり", "構造を見抜く", "（あと一つ、これから）"] },
  { id: "matchup", cat: "タイプあいしょう", icon: "⚡", lit: true, by: "friend", depth: 0.5,
    main: "「一緒に作る場」で こうかばつぐん",
    self: "", akari: "", friend: "急かされる・人混みは、ちょっと苦手そう",
    strong: ["一緒に作る場", "じっくり考える時間"], weak: ["急かされる状況", "人混み"] },
  { id: "heal", cat: "かいふくアイテム（機嫌の戻し方）", icon: "🍵", lit: false },
];

// ── フレーバー（データとは別レイヤー） ──
const FLAVOR = {
  bunrui: "つくる人",
  desc: "仲間と一つのものを作っている時、いちばん生き生きする。じっくり考える時間を好み、急かされると、すこし苦手。",
  seisokuchi: "少人数の、落ち着いた場所",
  kuchiguse: "「うそはつかない」",
};
const META = { takasa: "まだ測定中", omosa: "想いはずっしりめ" };

export default function PokedexZukan() {
  const [open, setOpen] = useState(null);
  const [icon, setIcon] = useState(null);
  const [picking, setPicking] = useState(false);

  const litItems = ENTRIES.filter((e) => e.lit).length;
  const litBig = BIG5.filter((b) => b.lit).length;
  const lit = litItems + litBig;
  const total = ENTRIES.length + BIG5.length;
  const depthAvg = Math.round(
    (ENTRIES.filter((e) => e.lit).reduce((a, e) => a + (e.depth || 0), 0) / Math.max(litItems, 1)) * 100
  );

  return (
    <div style={s.frame}>
      <style>{`
        @keyframes flicker{0%,100%{opacity:1;filter:brightness(1)}45%{opacity:.92;filter:brightness(1.12)}70%{opacity:.97}}
        @keyframes haloPulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.18);opacity:.85}}
        @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ent{animation:rise .3s ease both}
        .lamp{animation:flicker 3.5s ease-in-out infinite}
        .halo{animation:haloPulse 3.5s ease-in-out infinite}
        .tap{cursor:pointer;transition:transform .1s} .tap:active{transform:scale(.99)}
        .drawer{overflow:hidden;animation:rise .25s ease both}
      `}</style>

      {/* 図鑑デバイス */}
      <div style={s.device}>
        <div style={s.deviceLights}>
          <span className="lamp" style={s.bigLamp}><span className="halo" style={s.bigHalo} /></span>
          <span style={{ ...s.smLamp, background: "#E8743B" }} />
          <span style={{ ...s.smLamp, background: "#6BB36B" }} />
          <span style={{ ...s.smLamp, background: "#E8C13B" }} />
        </div>
        <div style={s.deviceTitle}>じぶん図鑑</div>
        <div style={s.deviceNo}>No.001 ／ あなた</div>
      </div>

      <div style={s.scroll}>
        {/* 姿＋ぶんるい（主役・大きく） */}
        <div style={s.hero}>
          <div className="tap" style={s.figureCircle} onClick={() => setPicking((p) => !p)}>
            {icon ? <span style={{ fontSize: 60 }}>{icon}</span> : <span style={s.figureQ}>?</span>}
            <span className="halo" style={s.figureHalo} />
          </div>
          <div style={s.bunrui}>{FLAVOR.bunrui}</div>
          <div style={s.heroName}>あなた</div>
          <div style={s.metaRow}>
            <span style={s.metaItem}>たかさ <b>{META.takasa}</b></span>
            <span style={s.metaDot}>・</span>
            <span style={s.metaItem}>おもさ <b>{META.omosa}</b></span>
          </div>
          <div style={s.figureHint}>{icon ? "タップで えらびなおす" : "タップして アイコンを えらぶ"}</div>
        </div>
        {picking && (
          <div className="drawer" style={s.pickerGrid}>
            {ICONS.map((ic) => (
              <div key={ic} className="tap" style={{ ...s.pickItem, ...(icon === ic ? s.pickOn : {}) }}
                onClick={() => { setIcon(ic); setPicking(false); }}>{ic}</div>
            ))}
          </div>
        )}

        {/* ずかんせつめい（フレーバー） */}
        <div style={s.flavorCard}>
          <div style={s.flavorLabel}>ずかんせつめい</div>
          <div style={s.flavorText}>{FLAVOR.desc}</div>
          <div style={s.flavorChips}>
            <span style={s.chip}>せいそくち：{FLAVOR.seisokuchi}</span>
            <span style={s.chip}>口ぐせ：{FLAVOR.kuchiguse}</span>
          </div>
        </div>

        {/* 灯り（数） */}
        <div style={s.lampPanel}>
          <div style={s.lampMeta}>
            <span><b style={{ color: "#E79A4C", fontSize: 17 }}>{lit}</b> / {total} 灯った</span>
            <span style={s.depthTag}>向き合った深さ {depthAvg}%</span>
          </div>
        </div>

        {/* ステータス（ビッグファイブ・レーダー） */}
        <div style={s.statCard}>
          <div style={s.cat}>ステータス</div>
          <Radar data={BIG5} />
          <div style={s.statNote}>まだ灯っていない軸は、これから伸びていく</div>
        </div>

        {/* 項目 */}
        <div style={s.list}>
          {ENTRIES.map((e, i) => (
            <Entry key={e.id} e={e} idx={i} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
          ))}
        </div>

        <div className="ent" style={s.akariNote}>
          <span style={{ fontSize: 17 }}>🕯</span>
          <div><b style={{ color: "#9A5A2E" }}>あかり</b>　{lit}つ灯りましたね。「おだやか」の軸、もう少し話したら見えてくる気がします。</div>
        </div>
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

// ── レーダーチャート（5角形・ビッグファイブ） ──
function Radar({ data }) {
  const cx = 130, cy = 118, R = 86;
  const n = data.length;
  const ang = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * R * r, cy + Math.sin(ang(i)) * R * r];
  const grid = [0.25, 0.5, 0.75, 1].map((r) =>
    data.map((_, i) => pt(i, r).join(",")).join(" ")
  );
  const poly = data.map((d, i) => pt(i, d.lit ? Math.max(d.val, 0.06) : 0.06).join(",")).join(" ");
  return (
    <svg viewBox="0 0 260 236" style={{ width: "100%", maxWidth: 300, display: "block", margin: "4px auto 0" }}>
      {grid.map((g, k) => (
        <polygon key={k} points={g} fill="none" stroke="#EAD9B8" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#EAD9B8" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(231,154,76,0.28)" stroke="#E79A4C" strokeWidth="2" />
      {data.map((d, i) => {
        const [x, y] = pt(i, d.lit ? Math.max(d.val, 0.06) : 0.06);
        return <circle key={i} cx={x} cy={y} r={d.lit ? 3.5 : 2.5} fill={d.lit ? "#E79A4C" : "#C7B493"} />;
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11.5" fontWeight="700" fill={d.lit ? "#6B4F33" : "#BCA77E"} fontFamily={JP}>
            {d.lit ? d.key : `${d.key}？`}
          </text>
        );
      })}
    </svg>
  );
}

function Entry({ e, idx, open, onToggle }) {
  if (!e.lit) {
    return (
      <div className="ent" style={{ ...s.card, ...s.cardDim, animationDelay: `${idx * 35}ms` }}>
        <div style={s.dimIcon}>?</div>
        <div style={{ flex: 1 }}>
          <div style={s.catDim}>{e.cat}</div>
          <div style={s.silhouette}>？ ？ ？　<span style={s.silhouetteSub}>まだ灯っていない</span></div>
        </div>
      </div>
    );
  }
  const src = SRC[e.by];
  const cols = [
    { key: "self", val: e.self },
    { key: "akari", val: e.akari },
    { key: "friend", val: e.friend },
  ];
  return (
    <div className="ent tap" style={{ ...s.card, animationDelay: `${idx * 35}ms` }} onClick={onToggle}>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <div style={s.litIcon}><span className="lamp" style={s.litIconGlow} /><span style={{ position: "relative" }}>{e.icon}</span></div>
        <div style={{ flex: 1 }}>
          <div style={s.cat}>{e.cat}</div>
          <div style={s.mainVal}>{e.main}</div>
          {e.moves && (
            <div style={s.movesBox}>{e.moves.map((m, k) => <div key={k} style={s.moveItem}>・{m}</div>)}</div>
          )}
          {e.strong && (
            <div style={s.matchBox}>
              <div style={s.matchLine}><span style={{ ...s.matchTag, background: "#FBE0D2", color: "#C16038" }}>こうかばつぐん</span><span style={s.matchVals}>{e.strong.join("・")}（力が出る）</span></div>
              <div style={s.matchLine}><span style={{ ...s.matchTag, background: "#E5EDF0", color: "#5E7C88" }}>こうかいまひとつ</span><span style={s.matchVals}>{e.weak.join("・")}（消耗する）</span></div>
            </div>
          )}
          <div style={s.byline}>
            <span style={{ color: src.color }}>{src.mark} {src.label}が灯した</span>
            <span style={s.depthMini}>深さ<span style={s.depthMiniBar}><span style={{ ...s.depthMiniFill, width: `${(e.depth || 0) * 100}%` }} /></span></span>
            <span style={s.expand}>{open ? "とじる ▲" : "三人の見方 ▼"}</span>
          </div>
        </div>
      </div>
      {open && (
        <div className="drawer" style={s.drawer}>
          {cols.map((c) => {
            const sc = SRC[c.key];
            return (
              <div key={c.key} style={s.colRow}>
                <span style={{ ...s.colMark, color: sc.color }}>{sc.mark} {sc.label}</span>
                <span style={c.val ? s.colVal : s.colEmpty}>{c.val || "（まだ書かれていない）"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  frame: { height: "100vh", maxWidth: 420, margin: "0 auto", fontFamily: JP, color: "#3B2E24", background: "linear-gradient(180deg,#FBEFDC 0%,#F5E2C4 100%)", display: "flex", flexDirection: "column" },
  device: { background: "linear-gradient(135deg,#D6493A,#B5392E)", padding: "16px 18px 14px", color: "#fff", flexShrink: 0, boxShadow: "0 3px 12px rgba(150,40,30,0.35)" },
  deviceLights: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  bigLamp: { position: "relative", width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #BFE6FF, #5BA0E0)", display: "inline-block", boxShadow: "0 0 10px rgba(120,190,255,0.9)" },
  bigHalo: { position: "absolute", inset: -6, borderRadius: "50%", background: "radial-gradient(circle, rgba(150,210,255,0.7), transparent 70%)" },
  smLamp: { width: 9, height: 9, borderRadius: "50%", display: "inline-block" },
  deviceTitle: { fontSize: 19, fontWeight: 800, letterSpacing: "0.06em" },
  deviceNo: { fontSize: 11.5, opacity: 0.9, marginTop: 2, letterSpacing: "0.04em" },
  scroll: { flex: 1, overflowY: "auto", padding: "16px 15px calc(18px + env(safe-area-inset-bottom))" },

  hero: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 14 },
  figureCircle: { position: "relative", width: 104, height: 104, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #FFF3DC, #F4DDB4)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #EFD3A0", marginBottom: 10 },
  figureHalo: { position: "absolute", inset: -7, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,200,120,0.55), transparent 70%)" },
  figureQ: { fontSize: 46, color: "#C7B493", fontWeight: 800 },
  bunrui: { fontSize: 12.5, fontWeight: 700, color: "#C07A3A", letterSpacing: "0.08em", background: "#FBE7CE", padding: "3px 12px", borderRadius: 20 },
  heroName: { fontSize: 22, fontWeight: 800, color: "#42342A", margin: "6px 0 2px" },
  metaRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#86663C" },
  metaItem: {}, metaDot: { color: "#C9B08A" },
  figureHint: { fontSize: 11, color: "#B08A57", marginTop: 7 },

  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 7, background: "#FFFDF8", borderRadius: 14, padding: 12, marginBottom: 14, border: "1px solid #F4E7CE" },
  pickItem: { aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, borderRadius: 10, background: "#FBF1DE", cursor: "pointer" },
  pickOn: { background: "#FFE6BE", border: "1.5px solid #E8A85C" },

  flavorCard: { background: "#FFFDF8", borderRadius: 16, padding: "14px 15px", marginBottom: 14, boxShadow: "0 4px 16px rgba(196,150,86,0.14)", border: "1px solid #F4E7CE" },
  flavorLabel: { fontSize: 10.5, fontWeight: 800, color: "#B0915F", letterSpacing: "0.12em", marginBottom: 6 },
  flavorText: { fontSize: 13.5, lineHeight: 1.7, color: "#4A3A2C" },
  flavorChips: { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 },
  chip: { fontSize: 11, color: "#8A6A40", background: "#F6EAD6", borderRadius: 8, padding: "4px 9px" },

  lampPanel: { background: "#FFFDF8", borderRadius: 14, padding: "11px 15px", marginBottom: 14, boxShadow: "0 3px 12px rgba(196,150,86,0.1)", border: "1px solid #F4E7CE" },
  lampMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "#9A8260" },
  depthTag: { fontSize: 11.5, color: "#C97FA8", fontWeight: 600 },

  statCard: { background: "#FFFDF8", borderRadius: 16, padding: "14px 12px 12px", marginBottom: 16, boxShadow: "0 4px 16px rgba(196,150,86,0.14)", border: "1px solid #F4E7CE" },
  statNote: { fontSize: 11, color: "#B0945F", textAlign: "center", marginTop: 4 },

  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "#FFFDF8", borderRadius: 15, padding: "13px 14px", boxShadow: "0 3px 12px rgba(196,150,86,0.1)", border: "1px solid #F4E7CE" },
  cardDim: { background: "rgba(255,253,248,0.5)", border: "1px dashed #E2CDA4", boxShadow: "none", display: "flex", gap: 11, alignItems: "center" },
  litIcon: { position: "relative", width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "#FBEFD6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  litIconGlow: { position: "absolute", inset: 0, borderRadius: 9, background: "radial-gradient(circle, rgba(245,200,120,0.6), transparent 70%)" },
  dimIcon: { width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "#EFE3CD", color: "#B7A079", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 },
  cat: { fontSize: 11, color: "#B0915F", fontWeight: 700, marginBottom: 3, letterSpacing: "0.03em" },
  catDim: { fontSize: 11.5, color: "#A0895F", fontWeight: 700, marginBottom: 3 },
  mainVal: { fontSize: 14.5, fontWeight: 700, color: "#42342A", marginBottom: 7, lineHeight: 1.4 },
  silhouette: { fontSize: 14, fontWeight: 800, color: "#C7B493", letterSpacing: "0.15em" },
  silhouetteSub: { fontSize: 11, fontWeight: 400, letterSpacing: 0 },
  movesBox: { background: "#FBF4E4", borderRadius: 10, padding: "8px 11px", marginBottom: 8 },
  moveItem: { fontSize: 12.5, color: "#5C4A34", lineHeight: 1.7 },
  matchBox: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 },
  matchLine: { display: "flex", alignItems: "center", gap: 8 },
  matchTag: { fontSize: 10.5, fontWeight: 800, borderRadius: 6, padding: "3px 7px", whiteSpace: "nowrap" },
  matchVals: { fontSize: 12, color: "#5C4A34" },
  byline: { display: "flex", alignItems: "center", gap: 10, fontSize: 11, flexWrap: "wrap" },
  depthMini: { display: "flex", alignItems: "center", gap: 4, color: "#B79A6E" },
  depthMiniBar: { width: 40, height: 4, background: "#EDE0CA", borderRadius: 3, overflow: "hidden", display: "inline-block" },
  depthMiniFill: { height: "100%", background: "linear-gradient(90deg,#E2A0C4,#C97FA8)", display: "block" },
  expand: { marginLeft: "auto", color: "#C98A3C", fontWeight: 700 },
  drawer: { marginTop: 11, paddingTop: 11, borderTop: "1px dashed #EAD9B8", display: "flex", flexDirection: "column", gap: 8 },
  colRow: { display: "flex", gap: 9, alignItems: "flex-start" },
  colMark: { fontSize: 11.5, fontWeight: 700, width: 64, flexShrink: 0 },
  colVal: { fontSize: 13, color: "#42342A", lineHeight: 1.5, flex: 1 },
  colEmpty: { fontSize: 12, color: "#BCA77E", flex: 1, fontStyle: "italic" },
  akariNote: { display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "12px 14px", background: "#FBE7CE", borderRadius: 14, fontSize: 12.5, lineHeight: 1.6, color: "#5C4630" },
};

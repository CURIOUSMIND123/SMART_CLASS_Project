import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Badge, useToast } from "../ui";
import { useUser } from "../App";

/* Touch-first smartboard mode. The PlantVerse lesson is ORIGINAL content
   (own SVG/Canvas graphics) — no NCERT/DIKSHA assets are copied. */

function PlantLesson({ onComplete }: any) {
  const [sun, setSun] = useState(true);
  const [water, setWater] = useState(true);
  const [co2, setCo2] = useState(true);
  const [view, setView] = useState<"whole" | "stomata" | "transport">("whole");
  const healthy = sun && water && co2;
  return (
    <div className="plantstage">
      <div className="plantpanel" style={{ display: "flex", flexDirection: "column" }}>
        <div className="togglerow">
          <button className={sun ? "on" : ""} onClick={() => setSun(!sun)}>☀️ Sunlight {sun ? "ON" : "OFF"}</button>
          <button className={water ? "on" : ""} onClick={() => setWater(!water)}>💧 Water {water ? "ON" : "OFF"}</button>
          <button className={co2 ? "on" : ""} onClick={() => setCo2(!co2)}>🫧 CO₂ {co2 ? "ON" : "OFF"}</button>
        </div>
        <div className="togglerow">
          <button className={view === "whole" ? "on" : ""} onClick={() => setView("whole")}>🌱 Whole plant</button>
          <button className={view === "stomata" ? "on" : ""} onClick={() => setView("stomata")}>🔬 Stomata (gas exchange)</button>
          <button className={view === "transport" ? "on" : ""} onClick={() => setView("transport")}>🚰 Xylem vs Phloem</button>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
          <svg viewBox="0 0 300 340" width="100%" style={{ maxHeight: 380 }}>
            {/* sun */}
            {sun && <g><circle cx="255" cy="45" r="24" fill="#ffd23b" /><g stroke="#ffd23b" strokeWidth="3">{[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;return <line key={a} x1={255+Math.cos(r)*28} y1={45+Math.sin(r)*28} x2={255+Math.cos(r)*40} y2={45+Math.sin(r)*40}/>;})}</g></g>}
            {view === "whole" && <>
              {/* soil */}
              <rect x="0" y="290" width="300" height="50" fill="#6b4a2b" />
              {/* pot water */}
              {water && <rect x="40" y="292" width="220" height="14" fill="#2f7fd6" opacity="0.5" />}
              {/* stem */}
              <rect x="145" y="150" width="10" height="145" fill={healthy ? "#3a8f3a" : "#8a8f5a"} rx="4" />
              {/* leaves */}
              {[[-1,170],[1,190],[-1,215],[1,235]].map(([dir,y],i)=>(
                <ellipse key={i} cx={150+dir*45} cy={y} rx="42" ry="17" fill={healthy?"#3fae4a":sun?"#9caf5a":"#b7a34a"} transform={`rotate(${dir*20} ${150+dir*45} ${y})`} />
              ))}
              {/* flower/health marker */}
              <circle cx="150" cy="140" r="16" fill={healthy ? "#ff7ac0" : "#c9c19a"} />
              {/* CO2 arrows in */}
              {co2 && <g fill="#8ecbff" fontSize="15">{[[60,120],[70,175],[55,225]].map(([x,y],i)=><text key={i} x={x} y={y}>CO₂→</text>)}</g>}
              {/* water uptake */}
              {water && <g stroke="#2f7fd6" strokeWidth="2" fill="none">{[130,150,170].map(x=><line key={x} x1={x} y1="295" x2={x} y2="260" markerEnd="url(#up)"/>)}</g>}
              <defs><marker id="up" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M4,0 L8,8 L0,8 Z" fill="#2f7fd6"/></marker></defs>
              <text x="150" y="325" textAnchor="middle" fill={healthy ? "#8ce0a0" : "#ffb36b"} fontSize="15" fontWeight="700">
                {healthy ? "Photosynthesis is happening 🌿" : "Missing an input — plant struggles"}
              </text>
            </>}
            {view === "stomata" && <>
              <ellipse cx="150" cy="150" rx="120" ry="80" fill="#2f6f3a" />
              {/* two guard cells forming a pore */}
              <path d="M110,150 Q150,110 190,150 Q150,150 110,150Z" fill="#7fd08a" stroke="#2f6f3a" strokeWidth="3" />
              <path d="M110,150 Q150,190 190,150 Q150,150 110,150Z" fill="#7fd08a" stroke="#2f6f3a" strokeWidth="3" />
              <ellipse cx="150" cy="150" rx="20" ry={co2 ? 26 : 6} fill="#0d1b3e" />
              {co2 && <text x="150" y="90" textAnchor="middle" fill="#8ecbff" fontSize="14">CO₂ in ↓ · O₂ out ↑</text>}
              <text x="150" y="255" textAnchor="middle" fill="#c8d5f5" fontSize="13">Guard cells open/close the stoma to control gas exchange</text>
            </>}
            {view === "transport" && <>
              <rect x="90" y="40" width="40" height="260" rx="8" fill="#2f7fd6" opacity="0.75" />
              <rect x="170" y="40" width="40" height="260" rx="8" fill="#3fae4a" opacity="0.8" />
              <text x="110" y="325" textAnchor="middle" fill="#8ecbff" fontSize="13">XYLEM</text>
              <text x="190" y="325" textAnchor="middle" fill="#8ce0a0" fontSize="13">PHLOEM</text>
              <g stroke="#fff" strokeWidth="2" fill="none">
                <line x1="110" y1="300" x2="110" y2="55" markerEnd="url(#up2)" /><text x="110" y="30" textAnchor="middle" fill="#8ecbff" fontSize="11">water ↑</text>
                <line x1="190" y1="55" x2="190" y2="300" markerEnd="url(#dn2)" /><text x="190" y="30" textAnchor="middle" fill="#8ce0a0" fontSize="11">food ↕</text>
              </g>
              <defs>
                <marker id="up2" markerWidth="10" markerHeight="10" refX="5" refY="7" orient="auto"><path d="M5,0 L10,10 L0,10Z" fill="#fff"/></marker>
                <marker id="dn2" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto"><path d="M0,0 L10,0 L5,10Z" fill="#fff"/></marker>
              </defs>
            </>}
          </svg>
        </div>
      </div>
      <div className="plantpanel">
        <h3>🌱 Life Processes in Plants</h3>
        <p><b>Class 7 · Science · Original interactive lesson.</b> Tap the inputs on the left and watch the plant respond.</p>
        <p>Plants make their own food by <b>photosynthesis</b>. They need three inputs: <b>sunlight</b>, <b>water</b> and <b>carbon dioxide</b>. Turn any one off and see what happens.</p>
        <p>🔬 <b>Stomata</b> view: tiny pores on the leaf where CO₂ enters and O₂ leaves.<br/>🚰 <b>Xylem vs Phloem</b>: xylem carries water up; phloem carries food around.</p>
        <PlantQuiz onComplete={onComplete} />
      </div>
    </div>
  );
}

function PlantQuiz({ onComplete }: any) {
  const Q = [
    { q: "Which THREE inputs does a plant need to make food?", opts: ["Sunlight, water, CO₂", "Soil, oxygen, salt", "Moonlight, sugar, sand"], a: 0 },
    { q: "Where does gas exchange happen in a leaf?", opts: ["Roots", "Stomata", "Flower"], a: 1 },
    { q: "Xylem mainly carries…", opts: ["Food downward", "Water upward", "Nothing"], a: 1 },
  ];
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  if (done) return (
    <div style={{ marginTop: 12 }}>
      <h3>Quiz complete: {score}/{Q.length} 🎉</h3>
      <button className="ok bigbtn" style={{ marginTop: 10 }} onClick={() => onComplete(Math.round((score / Q.length) * 100))}>Finish & record lesson</button>
    </div>
  );
  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const correct = idx === Q[i].a;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (i + 1 < Q.length) { setI(i + 1); setPicked(null); } else setDone(true);
    }, 900);
  };
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: 12 }}>
      <b style={{ fontSize: 13 }}>Quick quiz {i + 1}/{Q.length}</b>
      <p style={{ margin: "8px 0" }}>{Q[i].q}</p>
      {Q[i].opts.map((o, idx) => (
        <button key={idx} className={"quizopt" + (picked === null ? "" : idx === Q[i].a ? " correct" : idx === picked ? " wrong" : "")} onClick={() => pick(idx)}>{o}</button>
      ))}
    </div>
  );
}

function Whiteboard() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#0d1b3e";
    const pos = (e: any) => {
      const r = c.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) };
    };
    const down = (e: any) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = (e: any) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const up = () => (drawing.current = false);
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <b style={{ fontSize: 15 }}>Whiteboard</b>
        <button className="small" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); }}>Clear</button>
      </div>
      <canvas ref={ref} width={1100} height={520} className="wbcanvas" />
    </div>
  );
}

export default function Classroom() {
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const [content, setContent] = useState<any[]>([]);
  const [online, setOnline] = useState(true);
  const [mode, setMode] = useState<"menu" | "plant" | "whiteboard">("menu");
  const [started, setStarted] = useState<number>(0);
  useEffect(() => {
    api("/content").then(setContent).catch(() => {});
    api("/sync/state").then((s) => setOnline(s.online)).catch(() => {});
  }, []);
  const offlineReady = content.filter((c) => c.offline_ready && c.downloaded);
  const complete = async (quiz: number) => {
    try {
      const original = content.find((c) => c.provider.startsWith("Original"));
      await api("/lessons", { body: { content_id: original?.id, duration_min: Math.max(1, Math.round((Date.now() - started) / 60000)), participants: 27, quiz_score: quiz, school_id: user.school_id || 1, classroom_id: 1 } });
      toast(`Lesson recorded · quiz ${quiz}% · ${online ? "synced" : "queued offline"}`);
      setMode("menu");
    } catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="classroom">
      <div className="topbar">
        <button className="ghost" style={{ color: "#fff", borderColor: "#fff" }} onClick={() => nav("/")}>← Exit</button>
        <h2>🖥️ Classroom Mode</h2>
        <Badge tone={online ? "green" : "red"}>{online ? "ONLINE" : "OFFLINE — using local content"}</Badge>
        <div style={{ flex: 1 }} />
        <button className="bigbtn" onClick={() => setMode("whiteboard")}>✏️ Whiteboard</button>
        <button className="bigbtn" onClick={() => setMode("menu")}>📚 Lessons</button>
      </div>

      {mode === "menu" && (
        <>
          <p style={{ padding: "16px 24px 0", color: "#9db2e8", fontSize: 13 }}>
            Content available on this board (offline-ready & downloaded). Official DIKSHA/NCERT links open only when online; licensed & original packs play offline.
          </p>
          <div className="lessongrid">
            {content.map((c) => {
              const playable = c.offline_ready && c.downloaded;
              const isPlant = c.title.startsWith("PlantVerse");
              return (
                <div key={c.id} className="lessoncard" style={{ opacity: playable || !c.offline_ready ? 1 : 0.5 }}
                  onClick={() => { if (isPlant) { setStarted(Date.now()); setMode("plant"); } else if (!c.offline_ready) { toast("Official resource — opens on the state portal when online (no scraping)."); } else if (!playable) { toast("Not downloaded to this board yet — download from the Content page while online.", true); } else { setStarted(Date.now()); setMode("plant"); toast("Demo: only the PlantVerse lesson has an interactive player in this build."); } }}>
                  <div className="prov">{c.provider}</div>
                  <h4>{c.title}</h4>
                  <div className="meta">Class {c.class} · {c.subject} · {c.language}</div>
                  <div className="meta" style={{ marginTop: 6 }}>
                    {isPlant ? <Badge tone="green">▶ INTERACTIVE</Badge> : !c.offline_ready ? <Badge tone="blue">official link</Badge> : playable ? <Badge tone="green">offline ready</Badge> : <Badge tone="amber">not downloaded</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {mode === "plant" && <PlantLesson onComplete={complete} />}
      {mode === "whiteboard" && <Whiteboard />}
    </div>
  );
}

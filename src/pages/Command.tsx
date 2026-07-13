import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Card, Stat, Badge, inr, ragTone } from "../ui";
import { useUser } from "../App";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TOUR = [
  "Start here at the Command Centre",
  "Open a RED school below (needs action)",
  "Check its device health issue",
  "Enter Classroom Mode while OFFLINE (Sync page toggle)",
  "Mark attendance from the simulated fingerprint terminal",
  "Complete a lesson and quiz",
  "Raise a fault ticket and an expense",
  "Switch Internet ONLINE on the Sync page",
  "Watch these numbers update after sync",
];

export default function Command() {
  const { user } = useUser();
  const [d, setD] = useState<any>(null);
  const [district, setDistrict] = useState("All");
  const [tour, setTour] = useState(() => localStorage.getItem("aru_tour") !== "off");
  useEffect(() => {
    const load = () => api("/overview").then(setD).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  if (!d) return <p>Loading…</p>;
  const t = d.totals;
  const districts = ["All", ...Array.from(new Set(d.schools.map((s: any) => s.district)))];
  const schools = d.schools.filter((s: any) => district === "All" || s.district === district);
  const attention = d.schools.filter((s: any) => s.rag === "red");
  const byDistrict = districts.slice(1).map((name) => ({
    name,
    lessons: d.schools.filter((s: any) => s.district === name).reduce((a: number, s: any) => a + s.lessons, 0),
    boards: d.schools.filter((s: any) => s.district === name).reduce((a: number, s: any) => a + s.boards_online, 0),
  }));
  const minister = user.role === "minister";
  return (
    <>
      <div className="pagehead">
        <h2>{minister ? "State Education Command Centre" : "Government Command Centre"}</h2>
        <div className="sub">Arunachal Pradesh (demo) · live from synced school data</div>
        <div className="spacer" />
        <select style={{ width: 180 }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map((x: any) => <option key={x}>{x}</option>)}
        </select>
      </div>

      <div className="grid cols4">
        <Stat n={t.schools} l="Schools live" tone="blue" />
        <Stat n={`${t.boards_online}/${t.boards}`} l="Boards online" tone={t.boards_online === t.boards ? "teal" : "amber"} />
        <Stat n={t.sla_breaches} l="SLA breaches" tone={t.sla_breaches ? "red" : "teal"} />
        <Stat n={t.open_tickets} l="Open tickets" tone={t.open_tickets > 5 ? "amber" : "teal"} />
        <Stat n={`${t.trained}/${t.teachers}`} l="Teachers certified" tone="blue" />
        <Stat n={t.lessons_7d} l="Lessons taught (7 days)" tone="teal" />
        <Stat n={t.attendance_today} l="Attendance events today" tone="blue" />
        <Stat n={`${Math.round((t.spent / (t.allocated || 1)) * 100)}%`} l={`Budget used (${inr(t.spent)} of ${inr(t.allocated)})`} tone="amber" />
      </div>

      <div className="grid cols2" style={{ marginTop: 14 }}>
        <Card title="🚨 Schools needing action today">
          {attention.length === 0 && <p style={{ color: "var(--dim)", fontSize: 13 }}>All schools healthy.</p>}
          {attention.map((s: any) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
              <Badge tone="red">RED</Badge>
              <Link to={"/school/" + s.id} style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</Link>
              <span style={{ color: "var(--dim)", fontSize: 12 }}>
                {s.boards_online === 0 ? "all boards offline" : ""} {s.sla_breaches ? `· ${s.sla_breaches} SLA breach` : ""}
              </span>
            </div>
          ))}
        </Card>
        <Card title="District activity (synced lessons & online boards)">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={byDistrict}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="lessons" fill="#2457c5" radius={[4, 4, 0, 0]} name="Lessons" />
              <Bar dataKey="boards" fill="#0e9f7d" radius={[4, 4, 0, 0]} name="Boards online" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title={`Schools — drill down (${district})`} className="tscroll" >
        <table>
          <thead><tr><th>School</th><th>District / Block</th><th>Boards</th><th>Open tickets</th><th>Lessons</th><th>Budget used</th><th>Status</th></tr></thead>
          <tbody>
            {schools.map((s: any) => {
              const pct = Math.round((s.spent / (s.allocated || 1)) * 100);
              return (
                <tr key={s.id}>
                  <td><Link to={"/school/" + s.id} style={{ fontWeight: 600 }}>{s.name}</Link></td>
                  <td style={{ color: "var(--dim)" }}>{s.district} / {s.block}</td>
                  <td>{s.boards_online}/{s.boards}</td>
                  <td>{s.open_tickets}{s.sla_breaches ? <Badge tone="red"> {s.sla_breaches} overdue</Badge> : null}</td>
                  <td>{s.lessons}</td>
                  <td style={{ minWidth: 120 }}>
                    <div className={"progressbar" + (pct > 100 ? " over" : "")}><div style={{ width: Math.min(pct, 100) + "%" }} /></div>
                    <span style={{ fontSize: 11, color: pct > 100 ? "var(--red)" : "var(--dim)" }}>{pct}% {pct > 100 ? "OVER BUDGET" : ""}</span>
                  </td>
                  <td><Badge tone={ragTone(s.rag)}>{s.rag.toUpperCase()}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {tour && !minister && (
        <div className="tourbox noprint">
          <h4>🧭 10-minute demo tour</h4>
          <ol>{TOUR.map((x, i) => <li key={i}>{x}</li>)}</ol>
          <button className="small ghost" onClick={() => { setTour(false); localStorage.setItem("aru_tour", "off"); }}>Hide tour</button>
        </div>
      )}
    </>
  );
}

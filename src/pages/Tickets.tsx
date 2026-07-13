import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, dt, useToast } from "../ui";
import { useUser } from "../App";

const FLOW = ["New", "Acknowledged", "In Progress", "Waiting for Parts", "Resolved", "Closed"];
const CATS = ["Display fault", "Touch fault", "Power fault", "Network fault", "Content issue", "Training request", "Safety concern"];

export default function Tickets() {
  const { user } = useUser();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [nt, setNt] = useState({ category: "Display fault", priority: "high", title: "", descr: "", anonymous: false });
  const load = () => api("/tickets").then(setRows).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  const canAdvance = ["district_officer", "technician", "admin", "headmaster"].includes(user.role);
  const create = async () => {
    try { await api("/tickets", { body: { ...nt, school_id: user.school_id || 1 } }); toast("Ticket raised" + (nt.anonymous ? " (anonymous)" : "")); setNt({ ...nt, title: "", descr: "" }); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  const advance = async (id: number) => {
    try { const r = await api(`/tickets/${id}/advance`, { body: {} }); toast("Ticket → " + r.status); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <div className="pagehead"><h2>🛠️ Complaints, Faults & Help</h2><div className="sub">School → district → technician → OEM escalation · SLA timers · safeguarding channel</div></div>
      <div className="grid cols3">
        <Card title="Raise a ticket">
          <label>Category</label>
          <select value={nt.category} onChange={(e) => setNt({ ...nt, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <label>Priority</label>
          <select value={nt.priority} onChange={(e) => setNt({ ...nt, priority: e.target.value })}><option>normal</option><option>high</option><option>critical</option></select>
          <label>Title</label>
          <input value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} placeholder="Board 2 touch not working" />
          <label>Details</label>
          <textarea rows={2} value={nt.descr} onChange={(e) => setNt({ ...nt, descr: e.target.value })} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}><input type="checkbox" style={{ width: 16 }} checked={nt.anonymous} onChange={(e) => setNt({ ...nt, anonymous: e.target.checked })} /> Submit anonymously (safeguarding)</label>
          <button style={{ marginTop: 12 }} disabled={!nt.title} onClick={create}>Submit ticket</button>
        </Card>
        <Card title="Open by priority" className="">
          {["critical", "high", "normal"].map((p) => {
            const n = rows.filter((r) => r.priority === p && !["Resolved", "Closed"].includes(r.status)).length;
            return <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}><Badge tone={p === "critical" ? "red" : p === "high" ? "amber" : "grey"}>{p}</Badge><b>{n} open</b></div>;
          })}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span>SLA breached</span><b style={{ color: "var(--red)" }}>{rows.filter((r) => r.breached).length}</b></div>
        </Card>
        <Card title="SLA states">
          <p style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.9 }}>{FLOW.join(" → ")}</p>
          <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>Technician visit log, evidence photo (demo placeholder) and closure signature captured at Resolved/Closed.</p>
        </Card>
      </div>
      <Card title="All tickets" className="tscroll" style={{ marginTop: 14 }}>
        <table>
          <thead><tr><th>#</th><th>School</th><th>Category</th><th>Priority</th><th>Title</th><th>Status</th><th>SLA due</th><th>Escalation</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td><td>{r.school}</td><td>{r.category}</td>
                <td><Badge tone={r.priority === "critical" ? "red" : r.priority === "high" ? "amber" : "grey"}>{r.priority}</Badge></td>
                <td>{r.title}{r.anonymous ? <Badge tone="blue"> anon</Badge> : null}</td>
                <td><Badge tone={["Resolved", "Closed"].includes(r.status) ? "green" : "blue"}>{r.status}</Badge></td>
                <td>{r.breached ? <Badge tone="red">OVERDUE</Badge> : dt(r.sla_due)}</td>
                <td>{r.escalation}{r.assigned_to && <><br /><span style={{ fontSize: 11, color: "var(--dim)" }}>{r.assigned_to}</span></>}</td>
                <td>{canAdvance && !["Closed"].includes(r.status) && <button className="small" onClick={() => advance(r.id)}>Advance ▸</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

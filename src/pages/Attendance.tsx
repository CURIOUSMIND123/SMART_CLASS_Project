import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, dt, useToast } from "../ui";
import { useUser } from "../App";

export default function Attendance() {
  const { user } = useUser();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [correct, setCorrect] = useState<any>(null);
  const load = () => api("/attendance").then(setRows).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  const canMark = ["teacher", "headmaster", "admin"].includes(user.role);
  const canCorrect = ["headmaster", "district_officer", "admin"].includes(user.role);
  const fp = async () => {
    try { const r = await api("/attendance/biometric-sim", { body: { school_id: user.school_id || 1 } }); toast(`🖐️ Fingerprint: ${r.teacher} → ${r.status}`); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  const submitCorrection = async () => {
    try { await api(`/attendance/${correct.id}/correct`, { body: { new_status: correct.new_status, reason: correct.reason } }); toast("Correction recorded (original event kept immutable)"); setCorrect(null); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <div className="pagehead">
        <h2>🪪 Teacher Attendance</h2>
        <div className="sub">Immutable biometric-style events · tamper-evident hash chain · corrections are separate approved records</div>
        <div className="spacer" />
        {canMark && <button className="ok" onClick={fp}>🖐️ Simulate fingerprint punch</button>}
      </div>
      <Card>
        <p style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 12 }}>
          Each event stores a signed hash linked to the previous event. Attendance cannot be silently edited; a correction
          needs a written reason and an approver, and is stored alongside — not over — the original. (Production also needs
          device hardening, a real biometric terminal and secure key storage — software alone is not "tamper-proof".)
        </p>
        <div className="tscroll">
          <table>
            <thead><tr><th>When</th><th>School</th><th>Teacher</th><th>Status</th><th>Source</th><th>Hash</th><th>Sync</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{dt(r.ts)}</td><td>{r.school}</td><td>{r.teacher}</td>
                  <td><Badge tone={r.status === "present" ? "green" : r.status === "late" ? "amber" : "red"}>{r.status}</Badge>{r.corrections > 0 && <Badge tone="blue"> corrected</Badge>}</td>
                  <td><span style={{ fontSize: 11 }}>{r.source}</span></td>
                  <td><code style={{ fontSize: 10.5, color: "var(--dim)" }}>{r.hash.slice(0, 12)}…</code></td>
                  <td>{r.synced ? <Badge tone="green">synced</Badge> : <Badge tone="amber">queued</Badge>}</td>
                  <td>{canCorrect && <button className="small ghost" onClick={() => setCorrect({ id: r.id, new_status: "present", reason: "" })}>Correct</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {correct && (
        <div className="toast" style={{ position: "fixed", inset: "auto", left: "50%", top: "30%", transform: "translateX(-50%)", background: "#fff", color: "var(--ink)", border: "1px solid var(--line)", width: 380 }}>
          <h3 style={{ marginBottom: 10 }}>Correct attendance event #{correct.id}</h3>
          <label>New status</label>
          <select value={correct.new_status} onChange={(e) => setCorrect({ ...correct, new_status: e.target.value })}>
            {["present", "absent", "late", "leave", "disputed"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <label>Reason (mandatory, ≥5 chars)</label>
          <textarea rows={2} value={correct.reason} onChange={(e) => setCorrect({ ...correct, reason: e.target.value })} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={submitCorrection} disabled={(correct.reason || "").length < 5}>Save correction</button>
            <button className="ghost" onClick={() => setCorrect(null)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

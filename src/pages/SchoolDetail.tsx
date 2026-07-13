import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { Card, Badge, Stat, inr, dt, useToast } from "../ui";
import { useUser } from "../App";

export default function SchoolDetail({ id: idProp }: any) {
  const params = useParams();
  const id = idProp || params.id;
  const { user } = useUser();
  const toast = useToast();
  const [d, setD] = useState<any>(null);
  const [doc, setDoc] = useState({ kind: "marksheet", title: "", filename: "" });
  const load = () => api("/schools/" + id).then(setD).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, [id]);
  if (!d || !d.school) return <p>Loading…</p>;
  const s = d.school;
  const canUpload = ["teacher", "headmaster", "admin"].includes(user.role);
  const upload = async () => {
    try {
      await api("/documents", { body: { ...doc, school_id: s.id } });
      toast("Document recorded (demo placeholder file)"); setDoc({ kind: "marksheet", title: "", filename: "" }); load();
    } catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <div className="pagehead">
        <h2>🏫 {s.name}</h2>
        <div className="sub">{s.district} district · {s.block} block · {s.type} · UDISE {s.udise}</div>
        <div className="spacer" />
        {user.role !== "minister" && <Link className="btn" to="/classroom">Enter Classroom Mode</Link>}
      </div>
      <div className="grid cols4">
        <Stat n={d.devices.filter((x: any) => x.online).length + "/" + d.devices.length} l="Boards online" tone="blue" />
        <Stat n={d.teachers.length} l="Teachers" tone="teal" />
        <Stat n={d.students.length + "+"} l="Students (demo, anonymised)" tone="blue" />
        <Stat n={s.languages} l="Languages required" tone="amber" />
      </div>

      <div className="grid cols2" style={{ marginTop: 14 }}>
        <Card title="Smartboard asset register" className="tscroll">
          <table>
            <thead><tr><th>Board</th><th>Serial</th><th>Warranty</th><th>Heartbeat</th><th>Storage</th><th>Status</th></tr></thead>
            <tbody>
              {d.devices.map((v: any) => (
                <tr key={v.id}>
                  <td><b>{v.brand} {v.model}</b><br /><span style={{ fontSize: 11, color: "var(--dim)" }}>{v.classroom ?? "Smart Room"} · {v.os} · {v.ram_gb}GB/{v.storage_gb}GB · v{v.app_version}</span></td>
                  <td>{v.serial}</td>
                  <td>{v.warranty_end?.slice(0, 10)}<br /><Badge tone={v.amc_status === "active" ? "green" : "amber"}>AMC {v.amc_status}</Badge></td>
                  <td>{dt(v.last_heartbeat)}</td>
                  <td>{v.storage_free_gb} GB free</td>
                  <td><Badge tone={v.online ? "green" : "red"}>{v.online ? "ONLINE" : "OFFLINE"}</Badge>{v.power_status !== "OK" && <Badge tone="red">{v.power_status}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Classrooms & installation">
          <table>
            <thead><tr><th>Room</th><th>Power</th><th>Connectivity</th></tr></thead>
            <tbody>{d.classrooms.map((c: any) => <tr key={c.id}><td>{c.name}</td><td>{c.power}</td><td>{c.connectivity}</td></tr>)}</tbody>
          </table>
          <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>
            Installation: checklist ✅ · photo evidence on file (demo placeholder) · technician sign-off ✅ · accepted by {d.devices[0]?.accepted_by}
          </p>
        </Card>
      </div>

      <div className="grid cols2" style={{ marginTop: 14 }}>
        <Card title="Teacher directory" className="tscroll">
          <table>
            <thead><tr><th>Name</th><th>Subject</th><th>Training</th><th>Last board use</th></tr></thead>
            <tbody>
              {d.teachers.map((t: any) => (
                <tr key={t.id}><td>{t.name}{t.role === "Headmaster" && <Badge tone="blue"> HM</Badge>}</td><td>{t.subjects}</td>
                  <td><Badge tone={t.training_status === "certified" ? "green" : "amber"}>{t.training_status}</Badge></td><td>{dt(t.last_board_use)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div>
          <Card title="Budget allocations (2026-27)">
            {d.budgets.length === 0 && <p style={{ fontSize: 13, color: "var(--dim)" }}>No direct allocation rows for this school in the demo seed. See the Finance module for the programme view.</p>}
            {d.budgets.map((b: any) => <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}><span>{b.category}</span><b>{inr(b.allocated)}</b></div>)}
          </Card>
          <Card title="Documents (marksheets · report cards · notices)" className="" >
            {d.documents.map((x: any) => (
              <div key={x.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                📄 <b>{x.title}</b> <span style={{ color: "var(--dim)" }}>({x.kind}, {x.filename}) · {x.uploaded_by} · {dt(x.ts)}</span> {x.synced ? <Badge tone="green">synced</Badge> : <Badge tone="amber">queued</Badge>}
              </div>
            ))}
            {canUpload && (
              <div className="formrow" style={{ marginTop: 10 }}>
                <div><label>Type</label>
                  <select value={doc.kind} onChange={(e) => setDoc({ ...doc, kind: e.target.value })}>
                    <option value="marksheet">Marksheet</option><option value="report_card">Report card</option><option value="notice">Notice</option>
                  </select></div>
                <div><label>Title</label><input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} placeholder="Class 8 half-yearly marksheet" /></div>
                <div><label>Filename (pdf/jpg/png)</label><input value={doc.filename} onChange={(e) => setDoc({ ...doc, filename: e.target.value })} placeholder="marksheet.pdf" /></div>
                <div style={{ alignSelf: "flex-end" }}><button onClick={upload} disabled={!doc.title || !doc.filename}>Upload (demo)</button></div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Student register (anonymised demo records)" className="tscroll" >
        <table>
          <thead><tr><th>Code</th><th>Class</th><th>Attendance %</th><th>Average score</th></tr></thead>
          <tbody>
            {d.students.slice(0, 12).map((st: any) => (
              <tr key={st.id}><td>{st.code}</td><td>{st.class}</td><td>{st.attendance_pct}%</td><td>{st.avg_score}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>Showing 12 of {d.students.length} seeded records. No real student personal data is used anywhere in this demo.</p>
      </Card>
    </>
  );
}

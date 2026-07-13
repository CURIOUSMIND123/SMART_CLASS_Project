import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, Stat, dt, useToast } from "../ui";
import { useUser } from "../App";

export default function Health() {
  const { user } = useUser();
  const toast = useToast();
  const [devs, setDevs] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [hist, setHist] = useState<any[]>([]);
  const load = () => api("/devices").then(setDevs).catch((e) => toast(e.message, true));
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  const open = async (d: any) => { setSel(d); setHist(await api(`/devices/${d.id}/health`)); };
  const canCmd = ["admin", "district_officer", "technician"].includes(user.role);
  const cmd = async (c: string) => {
    try { await api(`/devices/${sel.id}/command`, { body: { command: c } }); toast(`Command '${c}' executed (demo simulation, audited)`); load(); setSel(null); }
    catch (e: any) { toast(e.message, true); }
  };
  const off = devs.filter((d) => !d.online).length;
  const lowDisk = devs.filter((d) => d.storage_free_gb < 8).length;
  return (
    <>
      <div className="pagehead"><h2>❤️ Device Health Monitoring</h2><div className="sub">Heartbeats every minute (simulated telemetry) · alerts · audited remote commands</div></div>
      <div className="grid cols4">
        <Stat n={devs.length} l="Boards registered" tone="blue" />
        <Stat n={devs.length - off} l="Online now" tone="teal" />
        <Stat n={off} l="Offline / unreachable" tone={off ? "red" : "teal"} />
        <Stat n={lowDisk} l="Low disk alerts" tone={lowDisk ? "amber" : "teal"} />
      </div>
      <Card title="Fleet status" className="tscroll" style={{ marginTop: 14 }}>
        <table>
          <thead><tr><th>School</th><th>Board</th><th>Serial</th><th>Heartbeat</th><th>App</th><th>Content</th><th>Disk free</th><th>Power</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {devs.map((d) => (
              <tr key={d.id}>
                <td>{d.school}</td><td>{d.brand} {d.model}</td><td style={{ fontSize: 11.5 }}>{d.serial}</td>
                <td>{dt(d.last_heartbeat)}</td><td>v{d.app_version}</td><td>{d.content_version}</td>
                <td style={{ color: d.storage_free_gb < 8 ? "var(--red)" : "inherit" }}>{d.storage_free_gb} GB{d.storage_free_gb < 8 && " ⚠"}</td>
                <td>{d.power_status === "OK" ? "OK" : <Badge tone="red">{d.power_status}</Badge>}</td>
                <td><Badge tone={d.online ? "green" : "red"}>{d.online ? "ONLINE" : "OFFLINE"}</Badge></td>
                <td><button className="small ghost" onClick={() => open(d)}>Inspect</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {sel && (
        <div className="toast" style={{ position: "fixed", left: "50%", top: "16%", transform: "translateX(-50%)", background: "#fff", color: "var(--ink)", border: "1px solid var(--line)", width: 520, maxHeight: "70vh", overflow: "auto" }}>
          <h3>{sel.brand} {sel.model} — {sel.school}</h3>
          <p style={{ fontSize: 12, color: "var(--dim)", margin: "6px 0 10px" }}>SN {sel.serial} · warranty to {sel.warranty_end?.slice(0, 10)} · AMC {sel.amc_status}</p>
          {canCmd && (
            <div className="togglerow">
              <button className="small" onClick={() => cmd("request_sync")}>Request sync</button>
              <button className="small" onClick={() => cmd("clear_cache")}>Clear cached content</button>
              <button className="small" onClick={() => cmd("push_content")}>Push content package</button>
              <button className="small" onClick={() => cmd("restart_app")}>Restart app</button>
            </div>
          )}
          <table style={{ marginTop: 8 }}>
            <thead><tr><th>When</th><th>Online</th><th>Disk</th><th>Power</th><th>Alert</th></tr></thead>
            <tbody>{hist.map((h) => <tr key={h.id}><td>{dt(h.ts)}</td><td>{h.online ? "yes" : "no"}</td><td>{h.disk_free_gb} GB</td><td>{h.power}</td><td style={{ color: "var(--red)" }}>{h.alert}</td></tr>)}</tbody>
          </table>
          <button className="ghost" style={{ marginTop: 10 }} onClick={() => setSel(null)}>Close</button>
        </div>
      )}
    </>
  );
}

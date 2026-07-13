import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, Stat, dt, useToast } from "../ui";

export default function SyncPage() {
  const toast = useToast();
  const [s, setS] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const load = async () => {
    setS(await api("/sync/state"));
    setQueue(await api("/sync/queue"));
  };
  useEffect(() => { load().catch(() => {}); const t = setInterval(() => load().catch(() => {}), 4000); return () => clearInterval(t); }, []);
  if (!s) return <p>Loading…</p>;
  const toggle = async (online: boolean) => {
    const r = await api("/sync/toggle", { body: { online } });
    toast(online ? `Internet ONLINE — ${r.processed} queued events synced to Central Cloud` : "Internet OFFLINE — everything keeps working locally");
    load();
  };
  const process = async () => {
    try { const r = await api("/sync/process", { body: {} }); toast(`${r.processed} events synced`); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <div className="pagehead"><h2>🔄 Offline & Synchronisation</h2><div className="sub">The offline-first core: local outbox queue → idempotent sync → simulated Central Cloud</div></div>
      <div className="grid cols4">
        <Card title="Demo internet state">
          <div style={{ display: "flex", gap: 8 }}>
            <button className={s.online ? "ok" : "ghost"} onClick={() => toggle(true)}>🌐 ONLINE</button>
            <button className={!s.online ? "danger" : "ghost"} onClick={() => toggle(false)}>✈️ OFFLINE</button>
          </div>
        </Card>
        <Stat n={s.pending} l="Events waiting in queue" tone={s.pending ? "amber" : "teal"} />
        <Stat n={s.synced} l="Events synced to cloud" tone="teal" />
        <Card title="Last cloud sync"><b style={{ fontSize: 14 }}>{s.last_sync ? dt(s.last_sync) : "never"}</b>
          <div style={{ marginTop: 10 }}><button className="small" onClick={process}>Process queue now</button></div>
        </Card>
      </div>
      <Card title="How it works" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.7 }}>
          Every attendance punch, lesson, ticket, expense and document made while offline is written to the local SQLite
          database <b>and</b> to this outbox with an idempotency key and integrity hash. When connectivity returns, the queue
          uploads to the Central Cloud; duplicates are rejected by key, immutable records (raw biometric events, approved
          expenses) can never be overwritten, and corrections travel as separate approved records. Try it: go OFFLINE, mark
          attendance and raise a ticket, watch this queue grow, then go ONLINE and watch the Command Centre update.
        </p>
      </Card>
      <Card title="Outbox / sync queue (latest 100)" className="tscroll" style={{ marginTop: 14 }}>
        <table>
          <thead><tr><th>#</th><th>Event</th><th>Created</th><th>Idempotency key</th><th>Status</th></tr></thead>
          <tbody>
            {queue.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td><td>{q.event_type}</td><td>{dt(q.created_ts)}</td>
                <td><code style={{ fontSize: 10.5, color: "var(--dim)" }}>{q.idem_key.slice(0, 16)}…</code></td>
                <td><Badge tone={q.status === "synced" ? "green" : "amber"}>{q.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

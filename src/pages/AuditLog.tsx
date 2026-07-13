import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, dt, useToast } from "../ui";

export default function AuditLog() {
  const toast = useToast();
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/audit").then(setD).catch((e) => toast(e.message, true)); }, []);
  if (!d) return <p>Loading…</p>;
  return (
    <>
      <div className="pagehead">
        <h2>🧾 Audit Trail</h2>
        <div className="sub">Hash-chained · every sensitive action attributable</div>
        <div className="spacer" />
        {d.chain_valid
          ? <Badge tone="green">CHAIN VERIFIED ✓ — no tampering detected</Badge>
          : <Badge tone="red">CHAIN BROKEN — records were modified!</Badge>}
      </div>
      <Card className="tscroll">
        <table>
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Detail</th><th>Hash</th></tr></thead>
          <tbody>
            {d.rows.map((r: any) => (
              <tr key={r.id}>
                <td>{dt(r.ts)}</td><td>{r.user}</td>
                <td><Badge tone="blue">{r.action}</Badge></td>
                <td style={{ maxWidth: 380 }}>{r.detail}</td>
                <td><code style={{ fontSize: 10.5, color: "var(--dim)" }}>{r.hash.slice(0, 10)}…</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

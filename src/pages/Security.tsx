import React from "react";
import { Card } from "../ui";

export default function Security() {
  return (
    <>
      <div className="pagehead"><h2>🔐 Security & Compliance</h2><div className="sub">What this demo implements — and what production additionally requires</div></div>
      <div className="grid cols2">
        <Card title="✅ Implemented in this demo">
          <ul style={{ fontSize: 13, lineHeight: 2, marginLeft: 18 }}>
            <li>Password hashing (scrypt, per-user salt)</li>
            <li>Role-based access control enforced on the server, per route</li>
            <li>Session expiry (8 hours)</li>
            <li>Hash-chained audit log — any edit to history breaks the chain visibly</li>
            <li>Immutable attendance events; corrections are separate approved records</li>
            <li>Approved financial records cannot be silently edited</li>
            <li>Idempotent sync — duplicate events rejected by key</li>
            <li>Input & file-type validation; parameterised SQL throughout</li>
            <li>No hard-coded production secrets; demo credentials documented as demo-only</li>
          </ul>
        </Card>
        <Card title="⚠️ Additionally required for production">
          <ul style={{ fontSize: 13, lineHeight: 2, marginLeft: 18 }}>
            <li>Device hardening & MDM on every board (kiosk mode, signed releases)</li>
            <li>Real biometric terminals with device-side signing & secure key storage</li>
            <li>TLS everywhere, certificate pinning for board→cloud sync</li>
            <li>Central key management (HSM/KMS) and secrets rotation</li>
            <li>Independent security testing / VAPT before go-live</li>
            <li>Network controls, backup & disaster recovery, DPDP Act compliance review</li>
            <li>Signed licence agreements for all third-party content</li>
          </ul>
        </Card>
      </div>
      <Card title="Honest claim policy" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          This platform is <b>tamper-resistant with audit evidence</b> — it is deliberately <b>not</b> described as
          "hack-proof". No software-only system is. What we guarantee instead: any tampering with attendance,
          finance or audit history is <b>detectable</b> (broken hash chain, orphaned idempotency keys, missing
          approvals), and every sensitive action is attributable to a logged user and role.
        </p>
      </Card>
      <Card title="Content licensing position" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.7 }}>
          NCERT/DIKSHA content is accessed via official links only — never scraped, copied, modified or repackaged;
          attribution is always retained. Publisher content plays only under a signed licence with expiry tracking.
          Original content is owned by the programme with full offline rights.
        </p>
      </Card>
    </>
  );
}

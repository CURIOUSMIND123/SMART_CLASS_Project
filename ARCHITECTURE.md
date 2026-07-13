# Architecture — Arunodaya Smart School Command (demo)

## The demo on one laptop

```
┌─────────────────────────── one Windows laptop ───────────────────────────┐
│                                                                          │
│  React SPA (dist/, built by Vite)                                        │
│      │  fetch /api/*                                                     │
│      ▼                                                                   │
│  Express server  :4600  ←── also wrapped by Electron (electron/main.cjs) │
│      │                                                                   │
│      ├── "School side": SQLite (server/arunodaya.db)                     │
│      │     schools, devices, teachers, attendance_events,                │
│      │     lessons_log, tickets, budgets/expenses, documents,            │
│      │     health_events, audit_log (hash-chained), outbox               │
│      │                                                                   │
│      └── "Central Cloud" (simulated in the same DB):                     │
│            cloud_events — the ledger the government dashboard trusts     │
└──────────────────────────────────────────────────────────────────────────┘
```

In production these become **two deployments**: the board app (Android/Electron kiosk with its own
SQLite) and a real cloud service (Postgres + object storage) — the sync contract stays identical.

## Offline-first sync contract

1. Every mutating action writes its row locally **and** appends to `outbox`
   (`event_type`, JSON payload, `created_ts`, unique `idem_key` = SHA-256).
2. A demo toggle (`settings.internet_online`) simulates connectivity. When OFF, the queue only grows;
   the app remains fully usable.
3. When ON (or on `POST /api/sync/process`), pending events upload to `cloud_events`.
   Duplicates are rejected by `idem_key` — re-processing is always safe (idempotent).
4. Synced rows get `synced=1`; government dashboards count **only synced** activity, so the
   Command Centre visibly updates the moment sync completes.

### Conflict rules
- Raw biometric attendance events are **immutable** — corrections are separate approved records.
- Approved financial records return `409` on any further edit attempt.
- Latest device-health event wins (telemetry is append-only anyway).

## Tamper evidence
- `audit_log` is hash-chained: `hash = sha256(prev_hash + ts + user + action + detail)`.
  `GET /api/audit` re-verifies the whole chain on every call and reports `chain_valid`.
- Attendance events carry their own chain (`prev_hash` → `hash`).

## Content connector boundary

`ContentProvider` interface (conceptual): `listCatalog · getMetadata · requestOfflinePackage ·
verifyLicense · syncUsageTelemetry`. Three implementations ship in the demo:

| Connector | What it does | What it never does |
|---|---|---|
| Official Resources (DIKSHA/NCERT) | stores **links**, opens official portals when online | download, scrape, copy, re-host, strip attribution |
| ArunLearn (fictional publisher) | simulates licensed package download, expiry tracking | run without a licence record |
| Original (Arunodaya) | bundles our own lessons (PlantVerse) offline | — (full rights) |

Real provider credentials are placeholders only; each real integration is one new adapter + a signed
agreement — zero core changes.

## Production changes required (summary)
Real MDM + kiosk hardening on boards · real biometric terminals with device-side signing · TLS with
pinning for board→cloud · Postgres + object storage in the cloud · per-school data partitioning ·
DPDP Act review · backup/DR · VAPT — detailed in `SECURITY_AND_COMPLIANCE.md`.

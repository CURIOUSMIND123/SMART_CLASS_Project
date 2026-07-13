# 🌄 Arunodaya Smart School Command

**Offline-first Smart Classroom, School Operations and Government Monitoring Platform — laptop demonstration.**

A working proof of the proposed offline-first smart-school operations and monitoring platform, ready for
technical validation, content-provider integration, OEM integration and a controlled pilot. It is **not**
"government approved", not "hack-proof", and not a finished statewide system — see `SECURITY_AND_COMPLIANCE.md`.

All data is **fictional demo data**. No real student personal data is used anywhere.

---

## Quick start (Windows laptop)

Requires **Node.js 20+** (22 recommended). Then:

```bash
npm install          # first time only
npm run dev          # starts API (:4600) + hot-reload UI (:5173)
```

Open **http://localhost:5173** — or for the exact single-server experience the board would run:

```bash
npm run build        # builds the UI into dist/
npm start            # one server at http://localhost:4600 (API + UI)
```

Other commands:

| Command | What it does |
|---|---|
| `npm test` | runs the 11 API tests (roles, sync, immutability, approvals, SLA, audit chain) |
| `npm run seed` | re-creates `server/arunodaya.db` — **this is the "Reset Demo Data" action**: delete `server/arunodaya.db` first, run this, restart |
| `npm run electron` | opens the app in a desktop window (run `npm run build` first; on first use install Electron binaries: `npm install electron --force`) |
| `npm run dist` | builds a Windows installer via electron-builder |

### Demo logins (demo only — never reuse these in production)

| Username | Password | Role |
|---|---|---|
| `teacher1` | `demo123` | Teacher (Classroom Mode) |
| `head1` | `demo123` | School Headmaster |
| `deo1` | `demo123` | District Education Officer |
| `minister` | `demo123` | State / Minister Viewer (read-only) |
| `tech1` | `demo123` | Field Technician |
| `finance1` | `demo123` | Finance Officer |
| `admin` | `demo123` | Platform Super Admin (sees everything) |

## What to demo (10 minutes)

See `DEMO_SCRIPT.md`. Short version: login as **admin** → Command Centre → go **OFFLINE** on the
Offline & Sync page → mark a fingerprint attendance, teach the PlantVerse lesson, raise a ticket,
record an expense → watch the queue grow → go **ONLINE** → watch everything sync and the
Command Centre update. Then sign in as **minister** to show the read-only government view.

## What's inside

- **Smartboard Classroom Mode** — touch-first, works offline, original interactive Class 7 Science
  lesson (PlantVerse: photosynthesis, stomata, xylem/phloem) with quiz, whiteboard, lesson logging.
- **Content connectors** — three layers: official DIKSHA/NCERT **links** (never scraped or repackaged),
  a fictional licensed publisher (ArunLearn) with package download + licence expiry, and original content.
- **Teacher attendance** — simulated fingerprint terminal, immutable hash-chained events, corrections
  as separate approved records with mandatory reasons.
- **School operations** — asset register with warranty/AMC, classrooms, teacher training status,
  anonymised student register, document uploads (marksheets/report cards/notices).
- **Tickets & complaints** — 7 categories incl. anonymous safeguarding, SLA timers, escalation chain.
- **Finance** — allocations vs actuals, expense entry with invoice, approval workflow, overspend alerts.
- **Device health** — heartbeats, storage/power alerts, audited remote commands (demo simulation).
- **Offline-first sync** — outbox queue with idempotency keys, big OFFLINE/ONLINE demo toggle,
  simulated Central Cloud.
- **Government Command Centre** — state → district → school drill-down, RAG statuses,
  "schools needing action today", budget utilisation, minister read-only mode.
- **Reports** — 6 CSV exports + printable view. **Audit** — hash-chained, self-verifying.

## Engineering decisions vs the original brief

Pragmatic substitutions, all documented here deliberately:

- **Plain CSS design system** instead of Tailwind + shadcn/ui (fewer moving parts, same look).
- **better-sqlite3 + hand-written schema** instead of Prisma/Drizzle (simpler, transparent, no codegen).
- **React Context** instead of Zustand/Redux (the state surface is small).
- **Express** serving both API and built UI; Electron wraps that same server (`electron/main.cjs`).
- Electron binaries are **not** downloaded during `npm install` in restricted environments; run
  `npm install electron --force` once on the demo laptop if `npm run electron` reports a missing binary.
- The "1 state / 3 districts / 6 blocks / 12 schools / 24 boards / 60 teachers / 300 students" demo
  dataset from the brief is seeded exactly, with mixed healthy/warning/critical conditions.

## Legal / content position

This demo **does not and will not** scrape, copy, modify or repackage NCERT/DIKSHA content.
Official resources appear as links that open the official portals when online. Publisher content is a
clearly-labelled fictional demo connector; production use requires a signed licence. Original content
(PlantVerse etc.) is owned by the programme. See the in-app **Security & Compliance** page.

---

> Previous repository contents (HumanLens PWA) remain available in git history.

# PLAN — Arunodaya Smart School Command (as executed)

1. **Scaffold** — package.json (Express + better-sqlite3 + React/Vite/TS + Electron config), deps installed.
2. **Database & seed** (`server/db.js`) — full schema + exact demo dataset from the brief
   (1 state, 3 districts, 6 blocks, 12 schools, 24 boards, 60 teachers, 300 students, mixed RAG conditions).
3. **API** (`server/index.js`) — auth/RBAC, attendance (+biometric sim, corrections), content connectors,
   lessons, tickets/SLA, finance approvals, documents, device health + remote commands, offline outbox +
   idempotent sync + simulated Central Cloud, hash-chained audit, 6 CSV reports.
4. **Frontend** (`src/`) — login, Command Centre w/ drill-down + tour, School detail, touch Classroom Mode
   with original PlantVerse interactive lesson + quiz + whiteboard, Attendance, Content, Tickets, Finance,
   Health, Offline & Sync, Reports, Security, Audit.
5. **Electron** wrapper + builder config for a Windows installer.
6. **Verification** — production build, full headless-browser walkthrough (login → offline → attendance →
   lesson → ticket → expense → sync → dashboards → minister view) with zero console/page errors;
   11 Vitest API tests, all passing.
7. **Docs** — README, DEMO_SCRIPT, ARCHITECTURE, SECURITY_AND_COMPLIANCE, .env.example.

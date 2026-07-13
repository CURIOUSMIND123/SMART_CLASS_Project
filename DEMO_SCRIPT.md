# 10-minute demo script — Arunodaya Smart School Command

**Setup (before the meeting):** `npm run build && npm start`, open http://localhost:4600,
sign in as `admin` / `demo123`. Keep this script beside you.

| Min | Do | Say |
|---|---|---|
| 0–1 | Show the **Command Centre**. Point at the 8 stat tiles and the RED "schools needing action" list. | "This is what the Deputy Commissioner or the Education Minister sees — every school, board, teacher and rupee in one place. Red means act today." |
| 1–2 | Click a RED school → its **asset register** (serials, warranty, heartbeat). | "Every board is a tracked government asset — serial, warranty, AMC, last heartbeat. Nothing disappears into a storeroom." |
| 2–3 | Go to **Offline & Sync** → press **✈️ OFFLINE**. | "Now the school has no internet — the normal condition in remote Arunachal. Watch: nothing stops working." |
| 3–4 | Go to **Attendance** → press **🖐️ Simulate fingerprint punch**. Show the hash column. | "Teacher attendance comes from a fingerprint terminal. Each event is hash-chained — editing history breaks the chain visibly. Corrections need a written reason and an approver, and never overwrite the original." |
| 4–6 | Enter **Classroom Mode** → open **PlantVerse** → toggle Sunlight OFF/ON, show Stomata view → answer the 3 quiz questions → **Finish & record lesson**. | "This is our original interactive content — every touch teaches. The lesson and quiz score are recorded even though we're offline." |
| 6–7 | **Tickets** → raise "Board 2 touch not working". **Finance** → record a ₹4,500 expense. | "Faults and expenses are captured at the school, against SLAs and budgets." |
| 7–8 | Back to **Offline & Sync** — show the queue with 4+ pending events. Press **🌐 ONLINE**. | "The board queued everything safely. The moment any connectivity appears — even briefly — it syncs. Duplicates are impossible: every event has an idempotency key." |
| 8–9 | Return to **Command Centre** — numbers have updated. Open **Audit** — "CHAIN VERIFIED ✓". | "And the state dashboard has already updated. The audit trail proves nobody — including us — quietly changed anything." |
| 9–10 | Sign out → sign in as `minister` / `demo123`. | "The Minister's view: read-only, red/amber/green, no student personal data. One glance says which schools need action today." |

**Closing line:** "Everything you saw runs on one board, offline, and reports to one government
dashboard. This is a working proof ready for technical validation, content licensing and a
controlled 10–20 school pilot — not a promise on a slide."

**If asked about NCERT/DIKSHA:** "We never copy their content. The platform links to the official
portals and imports only properly licensed publisher packages — the connector architecture makes
adding any approved provider a one-adapter job."

**Reset between demos:** stop the app, delete `server/arunodaya.db`, run `npm run seed`, restart.

# Security & Compliance — Arunodaya (demo)

## Implemented in this demo
- Password hashing: scrypt with per-user salt (no plaintext anywhere).
- Server-enforced role-based access control on every sensitive route (not hidden menus).
- Session expiry (8h) with opaque random tokens.
- Hash-chained audit log, re-verified on every read (`chain_valid`).
- Immutable attendance events; corrections are separate, approved, reasoned records.
- Approved financial records locked against silent edits (HTTP 409).
- Idempotent sync — duplicate events structurally impossible via unique keys.
- Input validation and file-type checks; parameterised SQL exclusively.
- No hard-coded production secrets; all demo credentials labelled demo-only.

## Honest limits — read before any government presentation
This platform is **tamper-resistant with audit evidence**. It is deliberately **not** called
"hack-proof": no software-only system is. The defensible claim is:

> Any tampering with attendance, finance or audit history is **detectable** (broken hash chain,
> orphaned idempotency keys, missing approvals), and every sensitive action is attributable to a
> logged user and role.

## Additionally required for production
1. **Device**: MDM enrolment, kiosk mode, signed releases, remote wipe, disk encryption on boards.
2. **Biometrics**: certified fingerprint terminals signing events on-device; secure key storage;
   anti-passback policy agreed with the department. Software alone cannot stop a school from,
   e.g., sharing fingerprints of absent staff — process + hardware controls are mandatory.
3. **Transport**: TLS everywhere, certificate pinning board→cloud, mutual auth for terminals.
4. **Keys/secrets**: KMS/HSM-backed key management and rotation; no secrets in the repo or app.
5. **Cloud**: managed Postgres, object storage for documents, per-school partitioning, backups,
   tested disaster recovery, monitoring/alerting.
6. **Assurance**: independent VAPT before go-live; periodic audits; incident response plan.
7. **Privacy**: DPDP Act 2023 compliance review; student data minimisation (the demo already uses
   anonymised codes and keeps the minister view free of personal data).
8. **Content**: signed licence agreements for every third-party provider; DIKSHA/NCERT used via
   official channels only, attribution retained, no commercial repackaging.

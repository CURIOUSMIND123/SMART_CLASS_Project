/* Arunodaya Smart School Command — local API + simulated Central Cloud (demo). */
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { db, sha, hashPassword, audit, isOnline, setOnline, queueEvent, processQueue } =
  require("./db.js");

const app = express();
app.use(express.json({ limit: "2mb" }));

/* ---------------- auth ---------------- */
const sessions = new Map(); // token -> user
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  const { hash } = hashPassword(password || "", u.salt);
  if (hash !== u.password_hash) {
    audit(username, "login_failed", "Bad password");
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = crypto.randomBytes(16).toString("hex");
  const user = { id: u.id, username: u.username, name: u.name, role: u.role, school_id: u.school_id };
  sessions.set(token, { user, expires: Date.now() + 8 * 3600e3 });
  audit(username, "login", "Role " + u.role);
  res.json({ token, user });
});
app.post("/api/logout", (req, res) => { sessions.delete(req.headers["x-token"]); res.json({ ok: true }); });

function auth(...roles) {
  return (req, res, next) => {
    const s = sessions.get(req.headers["x-token"]);
    if (!s || s.expires < Date.now()) return res.status(401).json({ error: "Not logged in" });
    if (roles.length && !roles.includes(s.user.role))
      return res.status(403).json({ error: "Role '" + s.user.role + "' is not permitted for this action" });
    req.user = s.user;
    next();
  };
}
const ANY = auth();

/* ---------------- offline / sync ---------------- */
app.get("/api/sync/state", ANY, (req, res) => {
  const pending = db.prepare("SELECT COUNT(*) c FROM outbox WHERE status='pending'").get().c;
  const synced = db.prepare("SELECT COUNT(*) c FROM outbox WHERE status='synced'").get().c;
  const last = db.prepare("SELECT received_ts FROM cloud_events ORDER BY id DESC LIMIT 1").get();
  res.json({ online: isOnline(), pending, synced, last_sync: last ? last.received_ts : null });
});
app.get("/api/sync/queue", ANY, (req, res) =>
  res.json(db.prepare("SELECT id,event_type,created_ts,status,idem_key FROM outbox ORDER BY id DESC LIMIT 100").all()));
app.post("/api/sync/toggle", ANY, (req, res) => {
  setOnline(!!req.body.online);
  audit(req.user.username, "internet_toggle", req.body.online ? "ONLINE" : "OFFLINE");
  let processed = 0;
  if (req.body.online) processed = processQueue();
  res.json({ online: isOnline(), processed });
});
app.post("/api/sync/process", ANY, (req, res) => {
  if (!isOnline()) return res.status(409).json({ error: "Internet is OFFLINE (demo toggle). Queue kept safely." });
  const processed = processQueue();
  audit(req.user.username, "sync", processed + " events synced to central cloud");
  res.json({ processed });
});

/* ---------------- geography & schools ---------------- */
app.get("/api/overview", ANY, (req, res) => {
  const q = (s) => db.prepare(s).get();
  const schools = db.prepare(`
    SELECT s.*, d.name AS district, b.name AS block,
      (SELECT COUNT(*) FROM devices v WHERE v.school_id=s.id) boards,
      (SELECT COUNT(*) FROM devices v WHERE v.school_id=s.id AND v.online=1) boards_online,
      (SELECT COUNT(*) FROM tickets t WHERE t.school_id=s.id AND t.status NOT IN ('Resolved','Closed')) open_tickets,
      (SELECT COUNT(*) FROM tickets t WHERE t.school_id=s.id AND t.status NOT IN ('Resolved','Closed') AND t.sla_due < datetime('now')) sla_breaches,
      (SELECT COUNT(*) FROM lessons_log l WHERE l.school_id=s.id AND l.synced=1) lessons,
      (SELECT IFNULL(SUM(allocated),0) FROM budgets bu WHERE bu.school_id=s.id) allocated,
      (SELECT IFNULL(SUM(amount),0) FROM expenses e WHERE e.school_id=s.id AND e.status='approved' AND e.synced=1) spent
    FROM schools s JOIN districts d ON d.id=s.district_id JOIN blocks b ON b.id=s.block_id`).all();
  schools.forEach((s) => {
    s.rag = s.boards_online === 0 || s.sla_breaches > 0 ? "red"
      : s.boards_online < s.boards || s.open_tickets > 0 ? "amber" : "green";
  });
  res.json({
    totals: {
      schools: q("SELECT COUNT(*) c FROM schools").c,
      boards: q("SELECT COUNT(*) c FROM devices").c,
      boards_online: q("SELECT COUNT(*) c FROM devices WHERE online=1").c,
      teachers: q("SELECT COUNT(*) c FROM teachers").c,
      trained: q("SELECT COUNT(*) c FROM teachers WHERE training_status='certified'").c,
      open_tickets: q("SELECT COUNT(*) c FROM tickets WHERE status NOT IN ('Resolved','Closed')").c,
      sla_breaches: q("SELECT COUNT(*) c FROM tickets WHERE status NOT IN ('Resolved','Closed') AND sla_due < datetime('now')").c,
      lessons_7d: q("SELECT COUNT(*) c FROM lessons_log WHERE synced=1 AND ts > datetime('now','-7 day')").c,
      attendance_today: q("SELECT COUNT(*) c FROM attendance_events WHERE synced=1 AND date(ts)=date('now')").c,
      allocated: q("SELECT IFNULL(SUM(allocated),0) c FROM budgets").c,
      spent: q("SELECT IFNULL(SUM(amount),0) c FROM expenses WHERE status='approved' AND synced=1").c,
    },
    schools,
  });
});
app.get("/api/schools/:id", ANY, (req, res) => {
  const id = +req.params.id;
  res.json({
    school: db.prepare(`SELECT s.*, d.name district, b.name block FROM schools s
      JOIN districts d ON d.id=s.district_id JOIN blocks b ON b.id=s.block_id WHERE s.id=?`).get(id),
    classrooms: db.prepare("SELECT * FROM classrooms WHERE school_id=?").all(id),
    devices: db.prepare("SELECT * FROM devices WHERE school_id=?").all(id),
    teachers: db.prepare("SELECT * FROM teachers WHERE school_id=?").all(id),
    students: db.prepare("SELECT * FROM students WHERE school_id=? LIMIT 40").all(id),
    documents: db.prepare("SELECT * FROM documents WHERE school_id=? ORDER BY id DESC").all(id),
    budgets: db.prepare("SELECT * FROM budgets WHERE school_id=?").all(id),
  });
});

/* ---------------- attendance ---------------- */
app.get("/api/attendance", ANY, (req, res) => {
  const rows = db.prepare(`SELECT a.*, t.name teacher, s.name school,
      (SELECT COUNT(*) FROM attendance_corrections c WHERE c.event_id=a.id) corrections
    FROM attendance_events a JOIN teachers t ON t.id=a.teacher_id JOIN schools s ON s.id=a.school_id
    ORDER BY a.ts DESC LIMIT 120`).all();
  res.json(rows);
});
app.post("/api/attendance", auth("teacher", "headmaster", "admin"), (req, res) => {
  const { teacher_id, status, source } = req.body;
  if (!teacher_id || !["present", "absent", "late", "leave", "disputed"].includes(status))
    return res.status(400).json({ error: "teacher_id and valid status required" });
  const t = db.prepare("SELECT * FROM teachers WHERE id=?").get(teacher_id);
  if (!t) return res.status(404).json({ error: "Unknown teacher" });
  const prev = db.prepare("SELECT hash FROM attendance_events ORDER BY id DESC LIMIT 1").get();
  const prev_hash = prev ? prev.hash : "GENESIS";
  const ts = new Date().toISOString();
  const hash = sha(prev_hash + ts + teacher_id + status);
  const rid = db.prepare(`INSERT INTO attendance_events(school_id,teacher_id,source,ts,status,hash,prev_hash,synced)
    VALUES(?,?,?,?,?,?,?,0)`).run(t.school_id, teacher_id, source || "manual", ts, status, hash, prev_hash).lastInsertRowid;
  queueEvent("attendance", { row_id: rid, teacher_id, status, ts });
  audit(req.user.username, "attendance", `Teacher ${teacher_id} marked ${status} (${source || "manual"})`);
  res.json({ ok: true, id: rid, hash });
});
/* simulated fingerprint terminal event */
app.post("/api/attendance/biometric-sim", ANY, (req, res) => {
  const t = db.prepare("SELECT * FROM teachers WHERE school_id=? ORDER BY RANDOM() LIMIT 1")
    .get(req.body.school_id || 1);
  const prev = db.prepare("SELECT hash FROM attendance_events ORDER BY id DESC LIMIT 1").get();
  const prev_hash = prev ? prev.hash : "GENESIS";
  const ts = new Date().toISOString();
  const status = new Date().getHours() >= 10 ? "late" : "present";
  const hash = sha(prev_hash + ts + t.id + status);
  const rid = db.prepare(`INSERT INTO attendance_events(school_id,teacher_id,source,ts,status,hash,prev_hash,synced)
    VALUES(?,?,?,?,?,?,?,0)`).run(t.school_id, t.id, "FP-TERMINAL-" + t.school_id, ts, status, hash, prev_hash).lastInsertRowid;
  queueEvent("attendance", { row_id: rid, teacher_id: t.id, status, ts, biometric: true });
  audit("fp-terminal-" + t.school_id, "attendance_biometric", `Fingerprint event for teacher ${t.id}: ${status}`);
  res.json({ ok: true, teacher: t.name, status, hash });
});
/* corrections: immutable original; correction is a separate approved record */
app.post("/api/attendance/:id/correct", auth("headmaster", "district_officer", "admin"), (req, res) => {
  const { new_status, reason } = req.body;
  if (!reason || reason.length < 5) return res.status(400).json({ error: "A written reason is mandatory for corrections" });
  const ev = db.prepare("SELECT * FROM attendance_events WHERE id=?").get(+req.params.id);
  if (!ev) return res.status(404).json({ error: "Event not found" });
  const rid = db.prepare("INSERT INTO attendance_corrections(event_id,new_status,reason,approved_by,ts,synced) VALUES(?,?,?,?,?,0)")
    .run(ev.id, new_status, reason, req.user.name, new Date().toISOString()).lastInsertRowid;
  queueEvent("correction", { row_id: rid, event_id: ev.id, new_status, reason });
  audit(req.user.username, "attendance_correction", `Event ${ev.id} corrected to ${new_status}: ${reason}`);
  res.json({ ok: true });
});

/* ---------------- content ---------------- */
app.get("/api/content", ANY, (req, res) =>
  res.json(db.prepare("SELECT * FROM content_items ORDER BY provider, class").all()));
app.post("/api/content/:id/download", ANY, (req, res) => {
  const c = db.prepare("SELECT * FROM content_items WHERE id=?").get(+req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (!c.offline_ready) return res.status(400).json({ error: "This item is link-only (official resource) — it cannot be downloaded. Open it online instead." });
  if (!isOnline()) return res.status(409).json({ error: "Internet OFFLINE — downloads need connectivity. Already-downloaded content keeps working." });
  db.prepare("UPDATE content_items SET downloaded=1 WHERE id=?").run(c.id);
  audit(req.user.username, "content_download", c.title);
  res.json({ ok: true });
});
app.post("/api/lessons", auth("teacher", "headmaster", "admin"), (req, res) => {
  const { content_id, duration_min, participants, quiz_score, school_id, classroom_id } = req.body;
  const rid = db.prepare(`INSERT INTO lessons_log(school_id,classroom_id,teacher_id,content_id,ts,duration_min,participants,quiz_score,synced)
    VALUES(?,?,?,?,?,?,?,?,0)`)
    .run(school_id || req.user.school_id || 1, classroom_id || 1, req.user.id, content_id,
      new Date().toISOString(), duration_min || 30, participants || 0, quiz_score ?? null).lastInsertRowid;
  queueEvent("lesson", { row_id: rid, content_id, participants, quiz_score });
  audit(req.user.username, "lesson_completed", "Content " + content_id);
  res.json({ ok: true });
});
app.get("/api/lessons", ANY, (req, res) =>
  res.json(db.prepare(`SELECT l.*, c.title, s.name school FROM lessons_log l
    LEFT JOIN content_items c ON c.id=l.content_id JOIN schools s ON s.id=l.school_id
    ORDER BY l.ts DESC LIMIT 60`).all()));

/* ---------------- tickets ---------------- */
const TICKET_FLOW = ["New", "Acknowledged", "In Progress", "Waiting for Parts", "Resolved", "Closed"];
app.get("/api/tickets", ANY, (req, res) =>
  res.json(db.prepare(`SELECT t.*, s.name school,
    CASE WHEN t.status NOT IN ('Resolved','Closed') AND t.sla_due < datetime('now') THEN 1 ELSE 0 END breached
    FROM tickets t JOIN schools s ON s.id=t.school_id ORDER BY t.created_ts DESC`).all()));
app.post("/api/tickets", ANY, (req, res) => {
  const { school_id, category, priority, title, descr, anonymous } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const rid = db.prepare(`INSERT INTO tickets(school_id,category,priority,title,descr,status,assigned_to,escalation,sla_due,created_ts,anonymous,synced)
    VALUES(?,?,?,?,?,'New','','school',?,?,?,0)`)
    .run(school_id || req.user.school_id || 1, category || "Content issue", priority || "normal",
      title, descr || "", new Date(Date.now() + 3 * 864e5).toISOString(), new Date().toISOString(),
      anonymous ? 1 : 0).lastInsertRowid;
  queueEvent("ticket", { row_id: rid, title, category, priority });
  audit(anonymous ? "anonymous" : req.user.username, "ticket_created", title);
  res.json({ ok: true, id: rid });
});
app.post("/api/tickets/:id/advance", auth("district_officer", "technician", "admin", "headmaster"), (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id=?").get(+req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  const i = TICKET_FLOW.indexOf(t.status);
  if (i >= TICKET_FLOW.length - 1) return res.status(400).json({ error: "Already closed" });
  const next = req.body.status && TICKET_FLOW.includes(req.body.status) ? req.body.status : TICKET_FLOW[i + 1];
  db.prepare("UPDATE tickets SET status=?, assigned_to=COALESCE(NULLIF(?,''),assigned_to), escalation=?, resolution=COALESCE(NULLIF(?,''),resolution), synced=0 WHERE id=?")
    .run(next, req.body.assigned_to || "", req.body.escalation || t.escalation, req.body.resolution || "", t.id);
  queueEvent("ticket", { row_id: t.id, status: next });
  audit(req.user.username, "ticket_update", `#${t.id} -> ${next}`);
  res.json({ ok: true, status: next });
});

/* ---------------- finance ---------------- */
app.get("/api/finance", ANY, (req, res) => {
  const budgets = db.prepare(`SELECT b.*, s.name school,
    (SELECT IFNULL(SUM(amount),0) FROM expenses e WHERE e.budget_id=b.id AND e.status='approved') spent
    FROM budgets b JOIN schools s ON s.id=b.school_id`).all();
  const expenses = db.prepare(`SELECT e.*, s.name school FROM expenses e
    JOIN schools s ON s.id=e.school_id ORDER BY e.date DESC`).all();
  res.json({ budgets, expenses });
});
app.post("/api/expenses", auth("headmaster", "finance", "admin"), (req, res) => {
  const { school_id, budget_id, vendor, invoice_no, date, category, amount } = req.body;
  if (!vendor || !invoice_no || !amount) return res.status(400).json({ error: "vendor, invoice_no, amount required" });
  const rid = db.prepare(`INSERT INTO expenses(school_id,budget_id,vendor,invoice_no,date,category,amount,status,attachment,synced)
    VALUES(?,?,?,?,?,?,?,'pending','demo-upload.pdf',0)`)
    .run(school_id || req.user.school_id || 1, budget_id || null, vendor, invoice_no,
      date || new Date().toISOString().slice(0, 10), category || "General", +amount).lastInsertRowid;
  queueEvent("expense", { row_id: rid, vendor, amount });
  audit(req.user.username, "expense_created", `${vendor} ₹${amount}`);
  res.json({ ok: true, id: rid });
});
app.post("/api/expenses/:id/decide", auth("finance", "admin"), (req, res) => {
  const e = db.prepare("SELECT * FROM expenses WHERE id=?").get(+req.params.id);
  if (!e) return res.status(404).json({ error: "Not found" });
  if (e.status !== "pending") return res.status(409).json({ error: "Approved/rejected records cannot be silently edited (audit rule)" });
  const status = req.body.approve ? "approved" : "rejected";
  db.prepare("UPDATE expenses SET status=?, approved_by=?, synced=0 WHERE id=?").run(status, req.user.name, e.id);
  queueEvent("expense", { row_id: e.id, status });
  audit(req.user.username, "expense_" + status, `#${e.id} ${e.vendor} ₹${e.amount}`);
  res.json({ ok: true, status });
});

/* ---------------- documents ---------------- */
app.post("/api/documents", auth("teacher", "headmaster", "admin"), (req, res) => {
  const { kind, title, filename, school_id } = req.body;
  if (!/\.(pdf|jpg|jpeg|png)$/i.test(filename || "")) return res.status(400).json({ error: "Only pdf/jpg/png allowed (demo rule)" });
  const rid = db.prepare("INSERT INTO documents(school_id,kind,title,filename,uploaded_by,ts,synced) VALUES(?,?,?,?,?,?,0)")
    .run(school_id || req.user.school_id || 1, kind || "notice", title, filename, req.user.name, new Date().toISOString()).lastInsertRowid;
  queueEvent("document", { row_id: rid, title });
  audit(req.user.username, "document_upload", title);
  res.json({ ok: true });
});

/* ---------------- device health & remote commands ---------------- */
app.get("/api/devices", ANY, (req, res) =>
  res.json(db.prepare(`SELECT d.*, s.name school, c.name classroom FROM devices d
    JOIN schools s ON s.id=d.school_id LEFT JOIN classrooms c ON c.id=d.classroom_id`).all()));
app.get("/api/devices/:id/health", ANY, (req, res) =>
  res.json(db.prepare("SELECT * FROM health_events WHERE device_id=? ORDER BY ts DESC LIMIT 20").all(+req.params.id)));
app.post("/api/devices/:id/command", auth("admin", "district_officer", "technician"), (req, res) => {
  const cmd = req.body.command;
  const OK = ["request_sync", "clear_cache", "push_content", "restart_app"];
  if (!OK.includes(cmd)) return res.status(400).json({ error: "Unknown command" });
  audit(req.user.username, "remote_command", `${cmd} -> device ${req.params.id} (demo simulation)`);
  if (cmd === "clear_cache")
    db.prepare("UPDATE devices SET storage_free_gb = MIN(storage_gb*0.8, storage_free_gb+12) WHERE id=?").run(+req.params.id);
  if (cmd === "restart_app")
    db.prepare("UPDATE devices SET last_heartbeat=?, online=1, power_status='OK' WHERE id=?").run(new Date().toISOString(), +req.params.id);
  res.json({ ok: true, note: "Demo simulation — logged in audit trail" });
});

/* simulated telemetry every minute */
setInterval(() => {
  try {
    const devs = db.prepare("SELECT * FROM devices WHERE online=1").all();
    for (const d of devs) {
      db.prepare("UPDATE devices SET last_heartbeat=? WHERE id=?").run(new Date().toISOString(), d.id);
      db.prepare("INSERT INTO health_events(device_id,ts,online,disk_free_gb,power,alert) VALUES(?,?,1,?,?,?)")
        .run(d.id, new Date().toISOString(), d.storage_free_gb, d.power_status, d.storage_free_gb < 8 ? "LOW DISK" : "");
    }
  } catch {}
}, 60e3).unref();

/* ---------------- audit & security ---------------- */
app.get("/api/audit", auth("admin", "district_officer", "minister", "finance"), (req, res) => {
  const rows = db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 200").all();
  // verify chain
  const all = db.prepare("SELECT * FROM audit_log ORDER BY id").all();
  let ok = true, prev = "GENESIS";
  for (const r of all) {
    if (r.prev_hash !== prev || r.hash !== sha(r.prev_hash + r.ts + r.user + r.action + r.detail)) { ok = false; break; }
    prev = r.hash;
  }
  res.json({ chain_valid: ok, rows });
});

/* ---------------- reports (CSV) ---------------- */
const csv = (res, name, header, rows) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.csv"`);
  res.send([header.join(","), ...rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n"));
};
app.get("/api/reports/:kind.csv", ANY, (req, res) => {
  const k = req.params.kind;
  if (k === "school-health") {
    const rows = db.prepare(`SELECT s.name school, d.brand, d.serial, d.online, d.power_status, d.storage_free_gb, d.last_heartbeat
      FROM devices d JOIN schools s ON s.id=d.school_id`).all();
    return csv(res, "weekly-school-health-DEMO", ["school","brand","serial","online","power_status","storage_free_gb","last_heartbeat"], rows);
  }
  if (k === "teacher-adoption") {
    const rows = db.prepare(`SELECT t.name teacher, s.name school, t.training_status, t.last_board_use,
      (SELECT COUNT(*) FROM lessons_log l WHERE l.teacher_id=t.id) lessons FROM teachers t JOIN schools s ON s.id=t.school_id`).all();
    return csv(res, "teacher-adoption-DEMO", ["teacher","school","training_status","last_board_use","lessons"], rows);
  }
  if (k === "content-usage") {
    const rows = db.prepare(`SELECT c.title, c.provider, COUNT(l.id) uses, ROUND(AVG(l.quiz_score),1) avg_quiz
      FROM content_items c LEFT JOIN lessons_log l ON l.content_id=c.id GROUP BY c.id ORDER BY uses DESC`).all();
    return csv(res, "content-usage-DEMO", ["title","provider","uses","avg_quiz"], rows);
  }
  if (k === "tickets") {
    const rows = db.prepare(`SELECT t.id, s.name school, t.category, t.priority, t.status, t.sla_due, t.created_ts
      FROM tickets t JOIN schools s ON s.id=t.school_id`).all();
    return csv(res, "ticket-sla-DEMO", ["id","school","category","priority","status","sla_due","created_ts"], rows);
  }
  if (k === "budget") {
    const rows = db.prepare(`SELECT s.name school, b.category, b.allocated,
      (SELECT IFNULL(SUM(amount),0) FROM expenses e WHERE e.budget_id=b.id AND e.status='approved') spent
      FROM budgets b JOIN schools s ON s.id=b.school_id`).all();
    return csv(res, "budget-utilisation-DEMO", ["school","category","allocated","spent"], rows);
  }
  if (k === "attendance-exceptions") {
    const rows = db.prepare(`SELECT a.id, s.name school, t.name teacher, a.status, a.ts, a.source,
      (SELECT COUNT(*) FROM attendance_corrections c WHERE c.event_id=a.id) corrections
      FROM attendance_events a JOIN teachers t ON t.id=a.teacher_id JOIN schools s ON s.id=a.school_id
      WHERE a.status != 'present' OR corrections > 0`).all();
    return csv(res, "attendance-exceptions-DEMO", ["id","school","teacher","status","ts","source","corrections"], rows);
  }
  res.status(404).json({ error: "Unknown report" });
});

/* ---------------- demo reset ---------------- */
app.post("/api/demo/reset", auth("admin"), (req, res) => {
  const fs = require("fs");
  audit(req.user.username, "demo_reset", "Reset requested — restart app to reseed");
  res.json({ ok: true, note: "Delete server/arunodaya.db and restart (npm run seed) — documented in README" });
});

/* ---------------- static (production build) ---------------- */
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (req, res, next) => {
  const idx = path.join(dist, "index.html");
  require("fs").existsSync(idx) ? res.sendFile(idx) : next();
});

const PORT = process.env.PORT || 4600;
if (require.main === module) {
  app.listen(PORT, () => console.log("Arunodaya API on http://localhost:" + PORT));
}
module.exports = { app };

/* Arunodaya Smart School Command — local database (demo).
   better-sqlite3, single file. All records are FICTIONAL DEMO DATA. */
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "arunodaya.db");
const RESEED = process.argv.includes("--reseed");
if (RESEED && fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, salt TEXT,
  name TEXT, role TEXT, school_id INTEGER);
CREATE TABLE IF NOT EXISTS districts(id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE IF NOT EXISTS blocks(id INTEGER PRIMARY KEY, district_id INTEGER, name TEXT);
CREATE TABLE IF NOT EXISTS schools(
  id INTEGER PRIMARY KEY, block_id INTEGER, district_id INTEGER, name TEXT,
  udise TEXT, principal TEXT, type TEXT, languages TEXT, status TEXT DEFAULT 'active');
CREATE TABLE IF NOT EXISTS classrooms(
  id INTEGER PRIMARY KEY, school_id INTEGER, name TEXT, power TEXT, connectivity TEXT);
CREATE TABLE IF NOT EXISTS devices(
  id INTEGER PRIMARY KEY, school_id INTEGER, classroom_id INTEGER, brand TEXT, model TEXT,
  serial TEXT, os TEXT, ram_gb INTEGER, storage_gb INTEGER, install_date TEXT,
  warranty_end TEXT, amc_status TEXT, last_heartbeat TEXT, app_version TEXT,
  content_version TEXT, storage_free_gb REAL, power_status TEXT, online INTEGER DEFAULT 1,
  install_checklist_done INTEGER DEFAULT 1, accepted_by TEXT);
CREATE TABLE IF NOT EXISTS teachers(
  id INTEGER PRIMARY KEY, school_id INTEGER, name TEXT, subjects TEXT, role TEXT,
  training_status TEXT, last_board_use TEXT);
CREATE TABLE IF NOT EXISTS students(
  id INTEGER PRIMARY KEY, school_id INTEGER, class TEXT, code TEXT,
  attendance_pct REAL, avg_score REAL);
CREATE TABLE IF NOT EXISTS attendance_events(
  id INTEGER PRIMARY KEY, school_id INTEGER, teacher_id INTEGER, source TEXT,
  ts TEXT, status TEXT, hash TEXT, prev_hash TEXT, synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS attendance_corrections(
  id INTEGER PRIMARY KEY, event_id INTEGER, new_status TEXT, reason TEXT,
  approved_by TEXT, ts TEXT, synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS content_items(
  id INTEGER PRIMARY KEY, provider TEXT, title TEXT, class TEXT, subject TEXT,
  chapter TEXT, language TEXT, licence TEXT, offline_ready INTEGER, size_mb REAL,
  expiry TEXT, source_ref TEXT, downloaded INTEGER DEFAULT 0, attribution TEXT);
CREATE TABLE IF NOT EXISTS lessons_log(
  id INTEGER PRIMARY KEY, school_id INTEGER, classroom_id INTEGER, teacher_id INTEGER,
  content_id INTEGER, ts TEXT, duration_min INTEGER, participants INTEGER,
  quiz_score REAL, synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS tickets(
  id INTEGER PRIMARY KEY, school_id INTEGER, category TEXT, priority TEXT, title TEXT,
  descr TEXT, status TEXT, assigned_to TEXT, escalation TEXT, sla_due TEXT,
  created_ts TEXT, resolution TEXT, rating INTEGER, anonymous INTEGER DEFAULT 0,
  synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS budgets(
  id INTEGER PRIMARY KEY, school_id INTEGER, category TEXT, year TEXT, allocated REAL);
CREATE TABLE IF NOT EXISTS expenses(
  id INTEGER PRIMARY KEY, school_id INTEGER, budget_id INTEGER, vendor TEXT,
  invoice_no TEXT, date TEXT, category TEXT, amount REAL, status TEXT,
  attachment TEXT, approved_by TEXT, synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS health_events(
  id INTEGER PRIMARY KEY, device_id INTEGER, ts TEXT, online INTEGER,
  disk_free_gb REAL, power TEXT, alert TEXT);
CREATE TABLE IF NOT EXISTS documents(
  id INTEGER PRIMARY KEY, school_id INTEGER, kind TEXT, title TEXT, filename TEXT,
  uploaded_by TEXT, ts TEXT, synced INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS outbox(
  id INTEGER PRIMARY KEY, event_type TEXT, payload TEXT, created_ts TEXT,
  retries INTEGER DEFAULT 0, idem_key TEXT UNIQUE, status TEXT DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS cloud_events(
  id INTEGER PRIMARY KEY, idem_key TEXT UNIQUE, event_type TEXT, payload TEXT, received_ts TEXT);
CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY, ts TEXT, user TEXT, action TEXT, detail TEXT,
  hash TEXT, prev_hash TEXT);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
`);

/* ---------- helpers exported to the API layer ---------- */
function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(8).toString("hex");
  return { salt, hash: crypto.scryptSync(pw, salt, 32).toString("hex") };
}
function audit(user, action, detail) {
  const prev = db.prepare("SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1").get();
  const prev_hash = prev ? prev.hash : "GENESIS";
  const ts = new Date().toISOString();
  const hash = sha(prev_hash + ts + user + action + detail);
  db.prepare(
    "INSERT INTO audit_log(ts,user,action,detail,hash,prev_hash) VALUES(?,?,?,?,?,?)"
  ).run(ts, user, action, detail, hash, prev_hash);
}
function isOnline() {
  const r = db.prepare("SELECT value FROM settings WHERE key='internet_online'").get();
  return r ? r.value === "1" : true;
}
function setOnline(v) {
  db.prepare("INSERT INTO settings(key,value) VALUES('internet_online',?) ON CONFLICT(key) DO UPDATE SET value=?")
    .run(v ? "1" : "0", v ? "1" : "0");
}
/* queue an event; if online it is synced immediately (still via the queue for a single code path) */
function queueEvent(type, payload) {
  const idem = sha(type + JSON.stringify(payload) + Date.now() + Math.random());
  db.prepare("INSERT INTO outbox(event_type,payload,created_ts,idem_key) VALUES(?,?,?,?)")
    .run(type, JSON.stringify(payload), new Date().toISOString(), idem);
  if (isOnline()) processQueue();
  return idem;
}
const SYNC_TABLES = {
  attendance: "attendance_events", correction: "attendance_corrections",
  lesson: "lessons_log", ticket: "tickets", expense: "expenses", document: "documents",
};
function processQueue() {
  const pending = db.prepare("SELECT * FROM outbox WHERE status='pending' ORDER BY id").all();
  let done = 0;
  for (const ev of pending) {
    const dup = db.prepare("SELECT 1 FROM cloud_events WHERE idem_key=?").get(ev.idem_key);
    if (!dup) {
      db.prepare("INSERT INTO cloud_events(idem_key,event_type,payload,received_ts) VALUES(?,?,?,?)")
        .run(ev.idem_key, ev.event_type, ev.payload, new Date().toISOString());
    }
    db.prepare("UPDATE outbox SET status='synced' WHERE id=?").run(ev.id);
    const t = SYNC_TABLES[ev.event_type];
    if (t) {
      const p = JSON.parse(ev.payload);
      if (p.row_id) db.prepare(`UPDATE ${t} SET synced=1 WHERE id=?`).run(p.row_id);
    }
    done++;
  }
  return done;
}

/* ---------- seed ---------- */
const seeded = db.prepare("SELECT COUNT(*) c FROM schools").get().c > 0;
if (!seeded) {
  const now = Date.now();
  const iso = (d) => new Date(d).toISOString();
  const daysAgo = (n) => iso(now - n * 864e5);

  const tx = db.transaction(() => {
    setOnline(true);

    /* geography: 1 state, 3 districts, 6 blocks, 12 schools */
    const DISTRICTS = ["Kurung Kumey", "Tirap", "Papum Pare"];
    DISTRICTS.forEach((d) => db.prepare("INSERT INTO districts(name) VALUES(?)").run(d));
    const BLOCKS = [
      [1, "Nyapin"], [1, "Koloriang"], [2, "Deomali"], [2, "Khonsa"], [3, "Itanagar"], [3, "Doimukh"],
    ];
    BLOCKS.forEach(([d, b]) => db.prepare("INSERT INTO blocks(district_id,name) VALUES(?,?)").run(d, b));

    const SCHOOL_NAMES = [
      "Govt UPS Nyapin", "Govt Sec School Sangram", "Govt HSS Koloriang", "Govt UPS Parsi-Parlo",
      "Govt UPS Deomali", "Govt Sec School Borduria", "Govt HSS Khonsa", "Govt UPS Lazu",
      "Govt Sec School Itanagar-II", "Govt HSS Naharlagun", "Govt UPS Doimukh", "Govt Sec School Sagalee",
    ];
    SCHOOL_NAMES.forEach((n, i) => {
      const block = (i % 6) + 1;
      const district = block <= 2 ? 1 : block <= 4 ? 2 : 3;
      db.prepare(
        "INSERT INTO schools(block_id,district_id,name,udise,principal,type,languages) VALUES(?,?,?,?,?,?,?)"
      ).run(block, district, n, "DEMO-UD-" + String(12000 + i), "Principal " + (i + 1) + " (DEMO)",
        n.includes("HSS") ? "Higher Secondary" : n.includes("Sec") ? "Secondary" : "Upper Primary",
        i % 3 === 0 ? "English, Hindi, Nyishi" : "English, Hindi");
    });

    /* 24 classrooms + 24 boards (2 per school) */
    const BRANDS = [["MAXHUB", "V6-75"], ["BenQ", "RE7504"], ["ViewSonic", "IFP7550"]];
    for (let s = 1; s <= 12; s++) {
      for (let c = 0; c < 2; c++) {
        const roomId = db.prepare(
          "INSERT INTO classrooms(school_id,name,power,connectivity) VALUES(?,?,?,?)"
        ).run(s, `Smart Room ${c + 1}`, c === 0 ? "Grid + UPS" : "Solar + UPS",
          s % 4 === 0 ? "None (offline school)" : "4G intermittent").lastInsertRowid;
        const [brand, model] = BRANDS[(s + c) % 3];
        const critical = s === 4 && c === 1;      // one dead board
        const warning = s % 5 === 0 && c === 0;   // low disk warning
        db.prepare(`INSERT INTO devices(school_id,classroom_id,brand,model,serial,os,ram_gb,storage_gb,
          install_date,warranty_end,amc_status,last_heartbeat,app_version,content_version,
          storage_free_gb,power_status,online,accepted_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(s, roomId, brand, model, `DEMO-SN-${1000 + s * 10 + c}`, "Android 13", 8, 128,
            daysAgo(200), iso(now + 700 * 864e5), s % 6 === 0 ? "expiring" : "active",
            critical ? daysAgo(6) : daysAgo(0),
            "1.4." + (c + 2), "2026.06",
            warning ? 4.2 : 38 + s, critical ? "UPS battery failed" : "OK",
            critical ? 0 : s % 4 === 0 ? 0 : 1, "Headmaster (DEMO)");
      }
    }

    /* 60 teachers, 300 students */
    const SUBJECTS = ["Science", "Maths", "English", "Social Science", "Hindi"];
    for (let i = 1; i <= 60; i++) {
      const s = ((i - 1) % 12) + 1;
      db.prepare("INSERT INTO teachers(school_id,name,subjects,role,training_status,last_board_use) VALUES(?,?,?,?,?,?)")
        .run(s, `Teacher ${String(i).padStart(2, "0")} (DEMO)`, SUBJECTS[i % 5],
          i % 12 === 0 ? "Headmaster" : "Teacher",
          i % 7 === 0 ? "pending" : i % 5 === 0 ? "refresher due" : "certified",
          i % 9 === 0 ? daysAgo(21) : daysAgo(i % 5));
    }
    for (let i = 1; i <= 300; i++) {
      const s = ((i - 1) % 12) + 1;
      db.prepare("INSERT INTO students(school_id,class,code,attendance_pct,avg_score) VALUES(?,?,?,?,?)")
        .run(s, "Class " + ((i % 8) + 3), `Student AR-${String(i).padStart(3, "0")}`,
          62 + (i * 7) % 35, 38 + (i * 13) % 55);
    }

    /* attendance: 30 events, hash-chained per school */
    let prevHash = "GENESIS";
    for (let i = 1; i <= 30; i++) {
      const s = ((i - 1) % 12) + 1;
      const teacher = db.prepare("SELECT id FROM teachers WHERE school_id=? LIMIT 1 OFFSET ?").get(s, i % 3);
      const ts = daysAgo(i % 4);
      const status = i % 11 === 0 ? "absent" : i % 7 === 0 ? "late" : "present";
      const h = sha(prevHash + ts + teacher.id + status);
      db.prepare("INSERT INTO attendance_events(school_id,teacher_id,source,ts,status,hash,prev_hash,synced) VALUES(?,?,?,?,?,?,?,1)")
        .run(s, teacher.id, i % 2 ? "FP-TERMINAL-" + s : "manual", ts, status, h, prevHash);
      prevHash = h;
    }

    /* content: 20 packages across 3 connectors */
    const addContent = (p) => db.prepare(`INSERT INTO content_items(provider,title,class,subject,chapter,language,
      licence,offline_ready,size_mb,expiry,source_ref,downloaded,attribution) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(p.provider, p.title, p.class, p.subject, p.chapter, p.lang, p.licence,
        p.offline ? 1 : 0, p.size, p.expiry || null, p.ref, p.dl ? 1 : 0, p.attr);
    // Official links connector — links only, no downloads
    [
      ["NCERT Class 7 Science Textbook (official link)", "7", "Science", "All chapters", "https://ncert.nic.in"],
      ["DIKSHA Class 10 Science energised textbook (official link)", "10", "Science", "All chapters", "https://diksha.gov.in"],
      ["DIKSHA Class 8 Maths practice (official link)", "8", "Maths", "All chapters", "https://diksha.gov.in"],
      ["NCERT Virtual Labs portal (official link)", "9-12", "Science", "Labs", "https://ncert.nic.in"],
      ["DIKSHA teacher training courses (official link)", "—", "Pedagogy", "Courses", "https://diksha.gov.in"],
    ].forEach(([t, c, sub, ch, ref]) => addContent({
      provider: "Official Resources (DIKSHA/NCERT)", title: t, class: c, subject: sub, chapter: ch,
      lang: "English/Hindi", licence: "Provider terms apply — opens official site when online; no scraping or repackaging",
      offline: false, size: 0, ref, dl: false, attr: "© NCERT / DIKSHA — official sources, attribution retained",
    }));
    // Licensed publisher connector (fictional)
    for (let i = 1; i <= 9; i++) addContent({
      provider: "ArunLearn Licensed Content (DEMO publisher)",
      title: `Class ${4 + (i % 6)} ${SUBJECTS[i % 5]} — Unit ${i} interactive pack`,
      class: String(4 + (i % 6)), subject: SUBJECTS[i % 5], chapter: "Unit " + i,
      lang: i % 3 ? "English" : "Hindi",
      licence: "Demo connector — production requires signed licence with publisher",
      offline: true, size: 120 + i * 15, expiry: iso(now + (i % 4 === 0 ? 20 : 300) * 864e5),
      ref: "pkg://arunlearn/unit-" + i, dl: i <= 5, attr: "© ArunLearn (fictional demo publisher)",
    });
    // Original content connector
    [
      ["PlantVerse: Life Processes in Plants (interactive 3D-style lesson)", "7", "Science", "Nutrition in Plants"],
      ["EyeVerse: The Human Eye and the Colourful World", "10", "Science", "Human Eye"],
      ["Fraction Factory (interactive)", "6", "Maths", "Fractions"],
      ["Arunachal Rivers & Ecology (local module — pending SCERT validation)", "8", "Social Science", "Local geography"],
      ["Electric Circuits Playground", "10", "Science", "Electricity"],
      ["Story Builder English (interactive)", "5", "English", "Composition"],
    ].forEach(([t, c, sub, ch]) => addContent({
      provider: "Original Content (Arunodaya)", title: t, class: c, subject: sub, chapter: ch,
      lang: "English", licence: "Owned by programme — full offline rights",
      offline: true, size: 40, ref: "local://original/" + t.slice(0, 12), dl: true, attr: "© Arunodaya programme (original)",
    }));

    /* lessons: usage history */
    for (let i = 1; i <= 18; i++) {
      const s = ((i - 1) % 12) + 1;
      db.prepare("INSERT INTO lessons_log(school_id,classroom_id,teacher_id,content_id,ts,duration_min,participants,quiz_score,synced) VALUES(?,?,?,?,?,?,?,?,1)")
        .run(s, s * 2 - 1, ((i - 1) % 60) + 1, 6 + (i % 14), daysAgo(i % 6), 25 + (i % 4) * 10, 18 + (i % 20), 45 + (i * 9) % 50);
    }

    /* tickets: 12, some overdue */
    const CATS = ["Display fault", "Touch fault", "Power fault", "Network fault", "Content issue", "Training request", "Safety concern"];
    const STATES = ["New", "Acknowledged", "In Progress", "Waiting for Parts", "Resolved", "Closed"];
    for (let i = 1; i <= 12; i++) {
      const overdue = i % 4 === 0;
      db.prepare(`INSERT INTO tickets(school_id,category,priority,title,descr,status,assigned_to,escalation,
        sla_due,created_ts,resolution,anonymous,synced) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1)`)
        .run(((i - 1) % 12) + 1, CATS[i % 7], i % 3 === 0 ? "critical" : i % 2 ? "high" : "normal",
          CATS[i % 7] + " — Smart Room " + ((i % 2) + 1),
          "DEMO ticket: " + CATS[i % 7].toLowerCase() + " reported by school staff.",
          STATES[i % 6], i % 3 === 0 ? "Technician T-0" + ((i % 3) + 1) : "",
          i % 3 === 0 ? "district" : "school",
          overdue ? daysAgo(2) : iso(now + 3 * 864e5), daysAgo(i % 8),
          STATES[i % 6] === "Closed" ? "Panel cable reseated; verified with school." : "", i === 11 ? 1 : 0);
    }

    /* budgets: 5 allocations + 15 expenses; school 3 over budget */
    const BCATS = ["Smart classroom", "Electricity/UPS", "Internet", "Maintenance", "Training"];
    BCATS.forEach((c, i) =>
      db.prepare("INSERT INTO budgets(school_id,category,year,allocated) VALUES(?,?,?,?)")
        .run(i + 1, c, "2026-27", [250000, 60000, 36000, 45000, 30000][i]));
    for (let i = 1; i <= 15; i++) {
      const b = ((i - 1) % 5) + 1;
      const big = b === 3 && i > 8; // pushes school 3 over its internet budget
      db.prepare(`INSERT INTO expenses(school_id,budget_id,vendor,invoice_no,date,category,amount,status,attachment,approved_by,synced)
        VALUES(?,?,?,?,?,?,?,?,?,?,1)`)
        .run(b, b, "Vendor " + ((i % 4) + 1) + " (DEMO)", "INV-DEMO-" + (400 + i), daysAgo(i * 3),
          BCATS[b - 1], big ? 21000 : 4000 + (i * 700) % 9000,
          i % 3 === 0 ? "pending" : "approved", "invoice-demo-" + i + ".pdf",
          i % 3 === 0 ? "" : "Finance Officer (DEMO)");
    }

    /* documents */
    [["marksheet", "Class 10 Half-Yearly Marksheet"], ["report_card", "Class 7B Report Cards"],
     ["notice", "Republic Day function notice"]].forEach(([k, t], i) =>
      db.prepare("INSERT INTO documents(school_id,kind,title,filename,uploaded_by,ts,synced) VALUES(?,?,?,?,?,?,1)")
        .run(i + 1, k, t + " (DEMO)", t.toLowerCase().replace(/ /g, "-") + ".pdf", "Headmaster (DEMO)", daysAgo(i + 1)));

    /* device health snapshots */
    const devs = db.prepare("SELECT id, online, storage_free_gb, power_status FROM devices").all();
    devs.forEach((d) => {
      for (let k = 3; k >= 0; k--) {
        db.prepare("INSERT INTO health_events(device_id,ts,online,disk_free_gb,power,alert) VALUES(?,?,?,?,?,?)")
          .run(d.id, daysAgo(k), d.online, d.storage_free_gb,
            d.power_status, d.storage_free_gb < 8 ? "LOW DISK" : d.online ? "" : "OFFLINE");
      }
    });

    /* demo users — passwords documented in README (demo only) */
    const USERS = [
      ["teacher1", "demo123", "Tanya Riba (DEMO)", "teacher", 1],
      ["head1", "demo123", "Headmaster Nyapin (DEMO)", "headmaster", 1],
      ["deo1", "demo123", "District Education Officer (DEMO)", "district_officer", null],
      ["minister", "demo123", "Hon'ble Minister Viewer (DEMO)", "minister", null],
      ["tech1", "demo123", "Field Technician T-01 (DEMO)", "technician", null],
      ["finance1", "demo123", "Finance Officer (DEMO)", "finance", null],
      ["admin", "demo123", "Platform Super Admin (DEMO)", "admin", null],
    ];
    USERS.forEach(([u, p, n, r, s]) => {
      const { salt, hash } = hashPassword(p);
      db.prepare("INSERT INTO users(username,password_hash,salt,name,role,school_id) VALUES(?,?,?,?,?,?)")
        .run(u, hash, salt, n, r, s);
    });

    audit("system", "seed", "Demo database seeded (fictional data only)");
  });
  tx();
  console.log("Seeded demo database at", DB_PATH);
}

module.exports = { db, sha, hashPassword, audit, isOnline, setOnline, queueEvent, processQueue };

/* Vidya Arunodaya launcher — offline, pendrive-friendly. */
let LANG = "en";
const app = document.getElementById("app");
const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.en[k];
const SIM_NAMES = {
  "balancing-chemical-equations": "Balancing Chemical Equations",
  "build-an-atom": "Build an Atom", "geometric-optics-basics": "Geometric Optics",
  "circuit-construction-kit-dc": "Circuit Construction Kit", "states-of-matter-basics": "States of Matter",
  "gravity-and-orbits": "Gravity and Orbits", "wave-on-a-string": "Wave on a String",
  "fraction-matcher": "Fraction Matcher",
};

function setLang(l) { LANG = l; render(); }

function topbar() {
  return `<div class="top">
    <div class="logo">🌄</div>
    <h1>Vidya Arunodaya<small>Offline Smart-Class Library · Arunachal Pradesh</small></h1>
    <div class="sp"></div>
    <span class="offline-badge">● ${t("offline")}</span>
    <div class="langsel">
      ${["en", "hi", "nyi"].map((l) => `<button class="${LANG === l ? "on" : ""}" onclick="setLang('${l}')">${I18N[l].lang}</button>`).join("")}
    </div>
  </div>`;
}

function render() {
  location.hash = location.hash || "#/";
  route();
}
window.onhashchange = route;

function route() {
  const parts = decodeURIComponent(location.hash.replace(/^#\//, "")).split("/").filter(Boolean);
  if (parts.length === 0) return home();
  if (parts.length === 1) return subjects(parts[0]);
  if (parts.length === 2) return chapters(parts[0], parts[1]);
  if (parts.length >= 3) return lesson(parts[0], parts[1], +parts[2]);
}

function home() {
  const classes = Object.keys(CURRICULUM);
  const totalCh = classes.reduce((a, c) => a + Object.values(CURRICULUM[c]).reduce((x, s) => x + s.length, 0), 0);
  const sims = new Set(); Object.values(CURRICULUM).forEach(c => Object.values(c).forEach(s => s.forEach(ch => ch.sim && sims.add(ch.sim))));
  app.innerHTML = topbar() + `
    <div class="wrap">
      <div class="hero">
        <h2>One board. Every subject. No internet needed.</h2>
        <p>NCERT-aligned chapters that open real interactive science simulations, 3D models and quizzes — in English, हिंदी and local language. Everything runs from the board's storage or a pendrive.</p>
        <div class="stats">
          <div><b>${totalCh}</b> chapters live</div>
          <div><b>${sims.size}</b> interactive sims</div>
          <div><b>EN · हिं · Nyishi</b> languages</div>
          <div><b>100%</b> offline</div>
        </div>
      </div>
      <div class="crumb"><b>${t("pick")}</b></div>
      <div class="tiles">
        ${classes.map((c) => {
          const n = Object.values(CURRICULUM[c]).reduce((a, s) => a + s.length, 0);
          const icon = c.includes("3D") ? "🧊" : "🎓";
          return `<div class="tile" onclick="location.hash='#/${encodeURIComponent(c)}'">
            <span class="cnt">${n} ch</span><div class="ic">${icon}</div><h3>${c}</h3>
            <div class="meta">${Object.keys(CURRICULUM[c]).join(" · ")}</div></div>`;
        }).join("")}
      </div>
    </div>`;
}

function subjects(cls) {
  const subs = CURRICULUM[cls];
  if (!subs) return home();
  app.innerHTML = topbar() + `
    <div class="wrap">
      <div class="crumb"><a onclick="location.hash='#/'">Home</a> › <b>${cls}</b></div>
      <div class="tiles">
        ${Object.keys(subs).map((s) => {
          const icon = s.includes("Math") ? "📐" : s.includes("3D") ? "🧊" : "🔬";
          return `<div class="tile" onclick="location.hash='#/${encodeURIComponent(cls)}/${encodeURIComponent(s)}'">
            <span class="cnt">${subs[s].length} ch</span><div class="ic">${icon}</div><h3>${s}</h3>
            <div class="meta">${subs[s].length} chapters</div></div>`;
        }).join("")}
      </div>
    </div>`;
}

function chapters(cls, sub) {
  const list = CURRICULUM[cls] && CURRICULUM[cls][sub];
  if (!list) return home();
  app.innerHTML = topbar() + `
    <div class="wrap">
      <div class="crumb"><a onclick="location.hash='#/'">Home</a> › <a onclick="location.hash='#/${encodeURIComponent(cls)}'">${cls}</a> › <b>${sub}</b></div>
      <div class="tiles">
        ${list.map((ch, i) => {
          const title = LANG === "hi" && ch.titleHi ? ch.titleHi : ch.title;
          const tags = [];
          if (ch.sim) tags.push('<span class="tag sim">SIMULATION</span>');
          if (ch.model) tags.push('<span class="tag d3">3D MODEL</span>');
          if (ch.original || ch.lesson) tags.push('<span class="tag orig">★ ORIGINAL</span>');
          if (ch.quiz && ch.quiz.length) tags.push('<span class="tag quiz">QUIZ</span>');
          tags.push('<span class="tag hi">हिं</span>');
          return `<div class="tile chapter" onclick="location.hash='#/${encodeURIComponent(cls)}/${encodeURIComponent(sub)}/${i}'">
            <span class="cnt">Ch ${ch.ch}</span><div class="ic">${ch.original || ch.lesson ? "✨" : ch.model ? "🧊" : "🔬"}</div>
            <h3>${title}</h3><div style="margin-top:8px">${tags.join("")}</div></div>`;
        }).join("")}
      </div>
    </div>`;
}

function lesson(cls, sub, i) {
  const ch = CURRICULUM[cls][sub][i];
  const title = LANG === "hi" && ch.titleHi ? ch.titleHi : ch.title;
  const notes = LANG === "hi" && ch.notesHi ? ch.notesHi : ch.notes;
  // available tabs
  const tabs = [];
  if (ch.lesson) tabs.push(["lesson", "✨ " + (t("explore"))]);
  if (ch.sim) tabs.push(["sim", "🔬 " + t("explore")]);
  if (ch.model) tabs.push(["model", "🧊 " + t("model3d")]);
  tabs.push(["read", "📖 " + t("read")]);
  if (ch.quiz && ch.quiz.length) tabs.push(["quiz", "✅ " + t("quiz")]);

  app.innerHTML = topbar() + `
    <div class="lessonhead">
      <a class="btn" onclick="location.hash='#/${encodeURIComponent(cls)}/${encodeURIComponent(sub)}'">←</a>
      <h2>${title}</h2>
      <div class="sp" style="flex:1"></div>
      <span style="color:var(--dim);font-size:13px">${cls} · ${sub} · Ch ${ch.ch}</span>
    </div>
    <div class="tabbar" id="tabbar">
      ${tabs.map(([k, label], idx) => `<button data-tab="${k}" class="${idx === 0 ? "on" : ""}">${label}</button>`).join("")}
    </div>
    <div class="stage" id="stage"></div>
    <div class="attrib" id="attrib"></div>`;

  const stage = document.getElementById("stage");
  const attrib = document.getElementById("attrib");
  function show(tab) {
    document.querySelectorAll("#tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    attrib.innerHTML = "";
    if (tab === "sim") {
      const loc = LANG === "hi" ? "hi" : "en";
      const file = `sims/${ch.sim}_${loc}.html`;
      stage.innerHTML = `<iframe src="${file}" allow="fullscreen" title="${ch.sim}"></iframe>`;
      attrib.innerHTML = `Simulation: <b>${SIM_NAMES[ch.sim] || ch.sim}</b> — © PhET Interactive Simulations, University of Colorado Boulder, licensed CC&nbsp;BY&nbsp;4.0 (phet.colorado.edu). Bundled offline with attribution. ${LANG === "hi" ? "हिंदी संस्करण।" : ""}`;
    } else if (tab === "lesson") {
      stage.innerHTML = `<iframe src="${ch.lesson}" allow="fullscreen" title="${ch.title}"></iframe>`;
      attrib.innerHTML = `Original interactive lesson built for the Arunachal programme — state-owned content.`;
    } else if (tab === "model") {
      stage.innerHTML = `<iframe src="${ch.model}" allow="fullscreen" title="3D model"></iframe>`;
      attrib.innerHTML = ch.sampleModel ? `Sample 3D asset shown to demonstrate the fully-offline interactive viewer (drag to rotate, scroll to zoom, animated). The deployed library plugs real CBSE 3D models (organs, molecules, machines) into this same viewer. Sample model: Khronos glTF, royalty-free.` : "";
    } else if (tab === "read") {
      stage.innerHTML = `<div class="readbox"><p>${notes}</p>${ch.ncert ? `<a class="off" href="${ch.ncert}" target="_blank" rel="noreferrer">🔗 ${t("official")}</a> <span style="font-size:12px;color:var(--dim)">(opens when online)</span>` : ""}</div>`;
      attrib.innerHTML = `Notes are original summaries written for this pack. Official NCERT chapter text opens from ncert.nic.in when online — never copied or repackaged.`;
    } else if (tab === "quiz") {
      renderQuiz(stage, ch.quiz);
    }
  }
  document.querySelectorAll("#tabbar button").forEach((b) => (b.onclick = () => show(b.dataset.tab)));
  show(tabs[0][0]);
}

function renderQuiz(stage, quiz) {
  let i = 0, score = 0;
  function step() {
    if (i >= quiz.length) {
      stage.innerHTML = `<div class="quizbox"><h3>Quiz complete — ${score}/${quiz.length} ✅</h3>
        <p style="color:var(--dim)">In the deployed board, this score is recorded and (when internet is available) reported to the district dashboard.</p>
        <button class="btn" onclick="location.hash=location.hash">Done</button></div>`;
      return;
    }
    const q = quiz[i];
    stage.innerHTML = `<div class="quizbox"><h3>Question ${i + 1} / ${quiz.length}</h3>
      <p style="font-size:16px;margin-bottom:8px">${q.q}</p>
      ${q.opts.map((o, idx) => `<button class="opt" data-i="${idx}">${o}</button>`).join("")}</div>`;
    stage.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
      const idx = +b.dataset.i;
      stage.querySelectorAll(".opt").forEach((x) => { const di = +x.dataset.i; if (di === q.a) x.classList.add("ok"); else if (di === idx) x.classList.add("no"); });
      if (idx === q.a) score++;
      setTimeout(() => { i++; step(); }, 850);
    }));
  }
  step();
}

render();

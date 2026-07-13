import React, { createContext, useContext, useEffect, useState } from "react";
import { HashRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { api, setToken, clearToken } from "./api";
import { ToastProvider, useToast } from "./ui";
import Command from "./pages/Command";
import SchoolDetail from "./pages/SchoolDetail";
import Classroom from "./pages/Classroom";
import Attendance from "./pages/Attendance";
import Content from "./pages/Content";
import Tickets from "./pages/Tickets";
import Finance from "./pages/Finance";
import Health from "./pages/Health";
import SyncPage from "./pages/SyncPage";
import Reports from "./pages/Reports";
import Security from "./pages/Security";
import AuditLog from "./pages/AuditLog";

export const UserCtx = createContext<any>(null);
export const useUser = () => useContext(UserCtx);

const MENU: Record<string, [string, string][]> = {
  teacher: [["/classroom", "🖥️ Classroom Mode"], ["/attendance", "🪪 Attendance"], ["/content", "📚 Content"], ["/tickets", "🛠️ Complaints & Help"], ["/sync", "🔄 Offline & Sync"]],
  headmaster: [["/", "🏫 My School"], ["/classroom", "🖥️ Classroom Mode"], ["/attendance", "🪪 Attendance"], ["/content", "📚 Content"], ["/tickets", "🛠️ Tickets"], ["/finance", "💰 Budget"], ["/sync", "🔄 Offline & Sync"], ["/reports", "📄 Reports"]],
  district_officer: [["/", "🗺️ District Command"], ["/health", "❤️ Device Health"], ["/tickets", "🛠️ Tickets"], ["/attendance", "🪪 Attendance"], ["/reports", "📄 Reports"], ["/audit", "🧾 Audit"], ["/sync", "🔄 Sync"]],
  minister: [["/", "🏛️ State Command"], ["/reports", "📄 Reports"], ["/audit", "🧾 Audit"]],
  technician: [["/health", "❤️ Device Health"], ["/tickets", "🛠️ Tickets"], ["/sync", "🔄 Sync"]],
  finance: [["/finance", "💰 Finance"], ["/reports", "📄 Reports"], ["/audit", "🧾 Audit"]],
  admin: [["/", "🏛️ Command Centre"], ["/classroom", "🖥️ Classroom Mode"], ["/attendance", "🪪 Attendance"], ["/content", "📚 Content"], ["/tickets", "🛠️ Tickets"], ["/finance", "💰 Finance"], ["/health", "❤️ Device Health"], ["/sync", "🔄 Offline & Sync"], ["/reports", "📄 Reports"], ["/audit", "🧾 Audit"], ["/security", "🔐 Security"]],
};
const HOME: Record<string, string> = { teacher: "/classroom", technician: "/health", finance: "/finance" };

function SyncPill() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    const load = () => api("/sync/state").then(setS).catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);
  if (!s) return null;
  return (
    <div className="syncpill" title="Demo internet state">
      <span className={"dot " + (s.online ? "on" : "off")} />
      {s.online ? "Internet ONLINE" : "OFFLINE"} · queue {s.pending}
    </div>
  );
}

function Shell({ children }: any) {
  const { user, logout } = useUser();
  const menu = MENU[user.role] || MENU.admin;
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>🌄 ARUNODAYA</h1>
          <small>Smart School Command<br />Offline-first · DEMO BUILD</small>
        </div>
        <nav className="nav">
          {menu.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>
          ))}
        </nav>
        <div className="userbox">
          <b>{user.name}</b>
          {user.role.replace("_", " ")}
          <div><button className="small ghost" style={{ borderColor: "#93a5d8", color: "#c0cdf2" }} onClick={logout}>Sign out</button></div>
        </div>
      </aside>
      <main className="main">
        <div className="demoribbon">
          DEMONSTRATION PROTOTYPE — all data is fictional. Production use of NCERT/DIKSHA/publisher
          content requires adherence to provider terms and written permissions where needed.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }} className="noprint"><SyncPill /></div>
        {children}
      </main>
    </div>
  );
}

function Login() {
  const { setUser } = useUser();
  const toast = useToast();
  const nav = useNavigate();
  const [u, setU] = useState("minister");
  const [p, setP] = useState("demo123");
  const ROLES = [["teacher1", "Teacher"], ["head1", "Headmaster"], ["deo1", "District Officer"], ["minister", "Minister Viewer"], ["tech1", "Technician"], ["finance1", "Finance"], ["admin", "Super Admin"]];
  const go = async () => {
    try {
      const r = await api("/login", { body: { username: u, password: p } });
      setToken(r.token);
      setUser(r.user);
      nav(HOME[r.user.role] || "/");
    } catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="loginwrap">
      <div className="logincard">
        <h1>🌄 Arunodaya Smart School Command</h1>
        <div className="tag">Offline-first smart classroom, school operations and government monitoring platform — <b>laptop demonstration</b>. All data fictional.</div>
        <label>Username</label>
        <input value={u} onChange={(e) => setU(e.target.value)} />
        <label>Password</label>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
        <div style={{ marginTop: 16 }}><button style={{ width: "100%" }} onClick={go}>Sign in</button></div>
        <div className="rolechips">
          {ROLES.map(([usr, label]) => <button key={usr} onClick={() => { setU(usr); setP("demo123"); }}>{label}</button>)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const s = localStorage.getItem("aru_user");
    return s ? JSON.parse(s) : null;
  });
  useEffect(() => {
    user ? localStorage.setItem("aru_user", JSON.stringify(user)) : localStorage.removeItem("aru_user");
  }, [user]);
  const logout = () => { api("/logout", { body: {} }).catch(() => {}); clearToken(); setUser(null); };
  return (
    <ToastProvider>
      <UserCtx.Provider value={{ user, setUser, logout }}>
        <HashRouter>
          {!user ? (
            <Routes><Route path="*" element={<Login />} /></Routes>
          ) : (
            <Routes>
              <Route path="/classroom" element={<Classroom />} />
              <Route path="*" element={
                <Shell>
                  <Routes>
                    <Route path="/" element={user.role === "headmaster" ? <SchoolDetail id={user.school_id} /> : <Command />} />
                    <Route path="/school/:id" element={<SchoolDetail />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/content" element={<Content />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/health" element={<Health />} />
                    <Route path="/sync" element={<SyncPage />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/audit" element={<AuditLog />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Shell>
              } />
            </Routes>
          )}
        </HashRouter>
      </UserCtx.Provider>
    </ToastProvider>
  );
}

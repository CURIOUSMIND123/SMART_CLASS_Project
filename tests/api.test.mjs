import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let server, base;
const tokens = {};

async function call(path, { token, body, method } = {}) {
  const res = await fetch(base + "/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: { "content-type": "application/json", "x-token": token || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
async function login(u) {
  const r = await call("/login", { body: { username: u, password: "demo123" } });
  tokens[u] = r.data.token;
  return r;
}

beforeAll(async () => {
  const { app } = require("../server/index.js");
  await new Promise((res) => { server = app.listen(0, res); });
  base = "http://localhost:" + server.address().port;
  for (const u of ["admin", "teacher1", "minister", "finance1", "head1", "deo1"]) await login(u);
  // make sure we start ONLINE
  await call("/sync/toggle", { token: tokens.admin, body: { online: true } });
});
afterAll(() => server && server.close());

describe("role-based access control", () => {
  it("rejects bad credentials", async () => {
    const r = await call("/login", { body: { username: "admin", password: "wrong" } });
    expect(r.status).toBe(401);
  });
  it("minister (viewer) cannot mark attendance", async () => {
    const r = await call("/attendance", { token: tokens.minister, body: { teacher_id: 1, status: "present" } });
    expect(r.status).toBe(403);
  });
  it("teacher can mark attendance", async () => {
    const r = await call("/attendance", { token: tokens.teacher1, body: { teacher_id: 1, status: "present" } });
    expect(r.status).toBe(200);
    expect(r.data.hash).toBeTruthy();
  });
  it("teacher cannot approve expenses", async () => {
    const r = await call("/expenses/1/decide", { token: tokens.teacher1, body: { approve: true } });
    expect(r.status).toBe(403);
  });
});

describe("offline queue & idempotent sync", () => {
  it("queues events while offline and syncs them once online", async () => {
    await call("/sync/toggle", { token: tokens.admin, body: { online: false } });
    const before = (await call("/sync/state", { token: tokens.admin })).data;
    const t = await call("/tickets", { token: tokens.teacher1, body: { title: "test offline ticket", school_id: 1 } });
    expect(t.status).toBe(200);
    const mid = (await call("/sync/state", { token: tokens.admin })).data;
    expect(mid.pending).toBe(before.pending + 1);
    // processing while offline must fail safely
    const denied = await call("/sync/process", { token: tokens.admin, body: {} });
    expect(denied.status).toBe(409);
    // back online: everything drains
    const on = await call("/sync/toggle", { token: tokens.admin, body: { online: true } });
    expect(on.data.processed).toBeGreaterThanOrEqual(1);
    const after = (await call("/sync/state", { token: tokens.admin })).data;
    expect(after.pending).toBe(0);
  });
  it("re-processing the queue creates no duplicate cloud events (idempotency)", async () => {
    const s1 = (await call("/sync/state", { token: tokens.admin })).data;
    const r = await call("/sync/process", { token: tokens.admin, body: {} });
    expect(r.data.processed).toBe(0); // nothing pending, nothing duplicated
    const s2 = (await call("/sync/state", { token: tokens.admin })).data;
    expect(s2.synced).toBe(s1.synced);
  });
});

describe("attendance immutability & corrections", () => {
  it("correction requires a written reason", async () => {
    const r = await call("/attendance/1/correct", { token: tokens.head1, body: { new_status: "leave", reason: "" } });
    expect(r.status).toBe(400);
  });
  it("correction keeps the original event and adds an audited record", async () => {
    const list1 = (await call("/attendance", { token: tokens.head1 })).data;
    const ev = list1[list1.length - 1];
    const r = await call(`/attendance/${ev.id}/correct`, {
      token: tokens.head1, body: { new_status: "leave", reason: "Teacher was on approved medical leave" } });
    expect(r.status).toBe(200);
    const list2 = (await call("/attendance", { token: tokens.head1 })).data;
    const same = list2.find((x) => x.id === ev.id);
    expect(same.status).toBe(ev.status);        // original untouched
    expect(same.corrections).toBe(ev.corrections + 1); // correction recorded alongside
  });
});

describe("budget approval workflow", () => {
  it("create -> approve -> locked", async () => {
    const c = await call("/expenses", { token: tokens.head1, body: { vendor: "Test Vendor", invoice_no: "INV-T1", amount: 999, school_id: 1 } });
    expect(c.status).toBe(200);
    const a = await call(`/expenses/${c.data.id}/decide`, { token: tokens.finance1, body: { approve: true } });
    expect(a.data.status).toBe("approved");
    const again = await call(`/expenses/${c.data.id}/decide`, { token: tokens.finance1, body: { approve: false } });
    expect(again.status).toBe(409); // approved records cannot be silently edited
  });
});

describe("ticket SLA flow", () => {
  it("advances through the SLA states", async () => {
    const c = await call("/tickets", { token: tokens.teacher1, body: { title: "SLA flow test", school_id: 1 } });
    const a1 = await call(`/tickets/${c.data.id}/advance`, { token: tokens.deo1, body: {} });
    expect(a1.data.status).toBe("Acknowledged");
    const a2 = await call(`/tickets/${c.data.id}/advance`, { token: tokens.deo1, body: {} });
    expect(a2.data.status).toBe("In Progress");
  });
});

describe("audit chain", () => {
  it("hash chain verifies as untampered", async () => {
    const r = await call("/audit", { token: tokens.admin });
    expect(r.data.chain_valid).toBe(true);
    expect(r.data.rows.length).toBeGreaterThan(5);
  });
});

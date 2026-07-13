import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, inr, useToast } from "../ui";
import { useUser } from "../App";

export default function Finance() {
  const { user } = useUser();
  const toast = useToast();
  const [d, setD] = useState<any>(null);
  const [ex, setEx] = useState({ vendor: "", invoice_no: "", category: "Maintenance", amount: "" });
  const load = () => api("/finance").then(setD).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  if (!d) return <p>Loading…</p>;
  const canEnter = ["headmaster", "finance", "admin"].includes(user.role);
  const canApprove = ["finance", "admin"].includes(user.role);
  const create = async () => {
    try { await api("/expenses", { body: { ...ex, amount: +ex.amount, school_id: user.school_id || 1 } }); toast("Expense submitted for approval"); setEx({ vendor: "", invoice_no: "", category: "Maintenance", amount: "" }); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  const decide = async (id: number, approve: boolean) => {
    try { await api(`/expenses/${id}/decide`, { body: { approve } }); toast(approve ? "Approved" : "Rejected"); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  const totalAlloc = d.budgets.reduce((a: number, b: any) => a + b.allocated, 0);
  const totalSpent = d.budgets.reduce((a: number, b: any) => a + b.spent, 0);
  return (
    <>
      <div className="pagehead"><h2>💰 School Budget & Expenses</h2><div className="sub">Allocation vs actual · invoice upload · approval workflow · overspend alerts (operational tracker, not statutory accounting)</div></div>
      <div className="grid cols3">
        <Card title="Allocated (all demo schools)"><div className="stat"><div className="n">{inr(totalAlloc)}</div></div></Card>
        <Card title="Approved spend"><div className="stat"><div className="n" style={{ color: "var(--teal)" }}>{inr(totalSpent)}</div></div></Card>
        <Card title="Utilisation"><div className="stat"><div className="n" style={{ color: totalSpent > totalAlloc ? "var(--red)" : "var(--amber)" }}>{Math.round((totalSpent / totalAlloc) * 100)}%</div></div></Card>
      </div>

      <Card title="Budget vs actual by category" className="tscroll" style={{ marginTop: 14 }}>
        <table>
          <thead><tr><th>School</th><th>Category</th><th>Allocated</th><th>Spent</th><th>Remaining</th><th>Utilisation</th></tr></thead>
          <tbody>
            {d.budgets.map((b: any) => {
              const pct = Math.round((b.spent / b.allocated) * 100);
              const over = b.spent > b.allocated;
              return (
                <tr key={b.id}>
                  <td>{b.school}</td><td>{b.category}</td><td>{inr(b.allocated)}</td><td>{inr(b.spent)}</td>
                  <td style={{ color: over ? "var(--red)" : "inherit" }}>{inr(b.allocated - b.spent)}</td>
                  <td style={{ minWidth: 130 }}>
                    <div className={"progressbar" + (over ? " over" : "")}><div style={{ width: Math.min(pct, 100) + "%" }} /></div>
                    <span style={{ fontSize: 11, color: over ? "var(--red)" : "var(--dim)" }}>{pct}%{over && " ⚠ OVER BUDGET"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="grid cols2" style={{ marginTop: 14 }}>
        {canEnter && (
          <Card title="Record an expense">
            <div className="formrow">
              <div><label>Vendor</label><input value={ex.vendor} onChange={(e) => setEx({ ...ex, vendor: e.target.value })} /></div>
              <div><label>Invoice #</label><input value={ex.invoice_no} onChange={(e) => setEx({ ...ex, invoice_no: e.target.value })} /></div>
            </div>
            <div className="formrow">
              <div><label>Category</label><select value={ex.category} onChange={(e) => setEx({ ...ex, category: e.target.value })}>{["Smart classroom", "Electricity/UPS", "Internet", "Maintenance", "Training"].map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label>Amount (₹)</label><input type="number" value={ex.amount} onChange={(e) => setEx({ ...ex, amount: e.target.value })} /></div>
            </div>
            <label>Invoice attachment</label><input value="invoice-demo.pdf" disabled />
            <button style={{ marginTop: 12 }} disabled={!ex.vendor || !ex.invoice_no || !ex.amount} onClick={create}>Submit for approval</button>
          </Card>
        )}
        <Card title="Expenses & approvals" className="tscroll">
          <table>
            <thead><tr><th>Vendor</th><th>Invoice</th><th>Category</th><th>Amount</th><th>Status</th>{canApprove && <th></th>}</tr></thead>
            <tbody>
              {d.expenses.slice(0, 16).map((e: any) => (
                <tr key={e.id}>
                  <td>{e.vendor}</td><td>{e.invoice_no}</td><td>{e.category}</td><td>{inr(e.amount)}</td>
                  <td><Badge tone={e.status === "approved" ? "green" : e.status === "rejected" ? "red" : "amber"}>{e.status}</Badge></td>
                  {canApprove && <td>{e.status === "pending" && <span style={{ display: "flex", gap: 4 }}><button className="small ok" onClick={() => decide(e.id, true)}>✓</button><button className="small danger" onClick={() => decide(e.id, false)}>✗</button></span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

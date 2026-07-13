import React from "react";
import { Card } from "../ui";

const REPORTS = [
  ["school-health", "Weekly school health report", "Board status, power, storage and heartbeats for every school"],
  ["teacher-adoption", "Teacher adoption report", "Training status, last board use and lessons taught per teacher"],
  ["content-usage", "Content / lesson usage report", "Which content is actually used, by provider, with average quiz scores"],
  ["tickets", "Ticket & SLA report", "All faults with priority, status and SLA due dates"],
  ["budget", "Budget utilisation report", "Allocated vs approved spend per school and category"],
  ["attendance-exceptions", "Attendance exception report", "Absences, lates and corrected events for review"],
];

export default function Reports() {
  const token = localStorage.getItem("aru_token") || "";
  const dl = async (kind: string) => {
    const res = await fetch(`/api/reports/${kind}.csv`, { headers: { "x-token": token } });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = kind + "-DEMO.csv";
    a.click();
  };
  return (
    <>
      <div className="pagehead">
        <h2>📄 Reports</h2>
        <div className="sub">CSV downloads for Samagra Shiksha-style monitoring · printable view</div>
        <div className="spacer" />
        <button className="ghost noprint" onClick={() => window.print()}>🖨️ Print this page</button>
      </div>
      <div className="grid cols3">
        {REPORTS.map(([kind, title, desc]) => (
          <Card key={kind} title={title}>
            <p style={{ fontSize: 12.5, color: "var(--dim)", minHeight: 44 }}>{desc}</p>
            <button className="small" onClick={() => dl(kind)}>⬇ Download CSV</button>
          </Card>
        ))}
      </div>
      <Card title="Note" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 12.5, color: "var(--dim)" }}>
          All reports are generated from the demo database and marked DEMO. In production these feed
          Samagra Shiksha / state monitoring formats agreed with the education department.
        </p>
      </Card>
    </>
  );
}

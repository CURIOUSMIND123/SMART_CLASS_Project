import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Card, Badge, dt, useToast } from "../ui";

export default function Content() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState("Official Resources (DIKSHA/NCERT)");
  const load = () => api("/content").then(setItems).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, []);
  const providers = Array.from(new Set(items.map((i) => i.provider)));
  const list = items.filter((i) => i.provider === tab);
  const download = async (id: number) => {
    try { await api(`/content/${id}/download`); toast("Content package downloaded to board (demo)"); load(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <div className="pagehead">
        <h2>📚 Content Catalogue & Connectors</h2>
        <div className="sub">Three layers: official links · licensed publisher packages · original content. No scraping or repackaging of NCERT/DIKSHA.</div>
      </div>
      <div className="togglerow" style={{ marginBottom: 6 }}>
        {providers.map((p) => (
          <button key={p} className={tab === p ? "" : "ghost"} onClick={() => setTab(p)}>{p}</button>
        ))}
      </div>
      {tab.startsWith("Official") && (
        <div className="demoribbon">These are <b>official links only</b>. The platform opens DIKSHA/NCERT on the state portal when online — it never downloads, copies, modifies or repackages their content. Attribution is always retained.</div>
      )}
      <div className="grid cols3">
        {list.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
              <Badge tone={c.provider.startsWith("Original") ? "green" : c.provider.startsWith("ArunLearn") ? "blue" : "grey"}>{c.provider.startsWith("Official") ? "OFFICIAL LINK" : c.provider.startsWith("ArunLearn") ? "LICENSED" : "ORIGINAL"}</Badge>
              {c.offline_ready ? (c.downloaded ? <Badge tone="green">offline ready</Badge> : <Badge tone="amber">not downloaded</Badge>) : <Badge tone="blue">online link</Badge>}
            </div>
            <h3 style={{ margin: "10px 0 6px", fontSize: 14 }}>{c.title}</h3>
            <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.6 }}>
              Class {c.class} · {c.subject} · {c.language}<br />
              {c.offline_ready ? `${c.size_mb} MB` : "link"} {c.expiry && <>· licence expiry {dt(c.expiry)}</>}<br />
              <b>Licence:</b> {c.licence}<br />
              <span style={{ fontSize: 11 }}>{c.attribution}</span><br />
              <span style={{ fontSize: 11, color: "#98a6c4" }}>source: {c.source_ref}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {c.offline_ready
                ? <button className="small" disabled={c.downloaded} onClick={() => download(c.id)}>{c.downloaded ? "Downloaded" : "Download to board"}</button>
                : <a className="btn small" href={c.source_ref} target="_blank" rel="noreferrer">Open official site</a>}
            </div>
          </Card>
        ))}
      </div>
      <Card title="Content connector architecture" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>
          Every provider implements the same interface — <code>listCatalog · getMetadata · requestOfflinePackage · verifyLicense · syncUsageTelemetry</code>.
          Production credentials/API keys are placeholders only. Adding a real publisher means writing one adapter and signing a licence — no core changes.
        </p>
      </Card>
    </>
  );
}

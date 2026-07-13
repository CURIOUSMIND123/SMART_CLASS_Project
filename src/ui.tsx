import React, { createContext, useContext, useState } from "react";

export const Card = ({ title, children, className = "" }: any) => (
  <div className={"card " + className}>{title && <h3>{title}</h3>}{children}</div>
);
export const Stat = ({ n, l, tone = "" }: any) => (
  <div className={"card stat " + tone}><div className="n">{n}</div><div className="l">{l}</div></div>
);
export const Badge = ({ tone = "grey", children }: any) => <span className={"badge " + tone}>{children}</span>;
export const ragTone = (r: string) => (r === "green" ? "green" : r === "amber" ? "amber" : "red");

const ToastCtx = createContext<any>(null);
export function ToastProvider({ children }: any) {
  const [msg, setMsg] = useState<any>(null);
  const toast = (text: string, err = false) => {
    setMsg({ text, err });
    setTimeout(() => setMsg(null), 3500);
  };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {msg && <div className={"toast" + (msg.err ? " err" : "")}>{msg.text}</div>}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export const inr = (n: number) => "₹" + (n || 0).toLocaleString("en-IN");
export const dt = (s: string) => (s ? new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

let token = localStorage.getItem("aru_token") || "";
export const setToken = (t: string) => { token = t; localStorage.setItem("aru_token", t); };
export const clearToken = () => { token = ""; localStorage.removeItem("aru_token"); };

export async function api(path: string, opts: any = {}) {
  const res = await fetch("/api" + path, {
    method: opts.method || (opts.body ? "POST" : "GET"),
    headers: { "content-type": "application/json", "x-token": token },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

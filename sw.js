'use strict';
// ═══════════════════════════════════════════════════════════════
// HumanLens Service Worker
// Handles: caching, FCM push, background scan, notifications
// ═══════════════════════════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ── Firebase config (same as in index.html) ───────────────────
// REPLACE these values with your own from Firebase Console
firebase.initializeApp({
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
});

const messaging = firebase.messaging();

// ── FCM background message handler ────────────────────────────
// This fires when a push arrives and the app is in the background/closed
messaging.onBackgroundMessage(payload => {
  console.log('[SW] FCM background message:', payload);
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  return self.registration.showNotification(title || '🎯 HumanLens Alert', {
    body: body || 'New signal detected',
    icon:  '/icon.svg',
    badge: '/icon.svg',
    tag:   data.tag || `hl-${data.sym || 'alert'}`,
    renotify:           true,
    requireInteraction: true,
    vibrate: [200, 100, 300, 100, 200],
    data: { url: '/', ...data },
    actions: [{ action: 'open', title: '📊 Open App' }]
  });
});

// ── Cache constants ────────────────────────────────────────────
const CACHE = 'humanlens-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];
const BASE  = 'https://fapi.binance.com';
const SKIP  = new Set(['BUSDUSDT','USDCUSDT','TUSDUSDT','FDUSDUSDT','USDPUSDT','BTCDOMUSDT','DEFIUSDT']);

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch (cache-first for shell) ─────────────────────────────
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (u.includes('binance.com') || u.includes('googleapis') || u.includes('gstatic')) return;
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(res => {
        if (res && res.ok) {
          const c = res.clone();
          caches.open(CACHE).then(ca => ca.put(e.request, c));
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});

// ── Notification click ─────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.includes('index.html') || c.url.endsWith('/')) { c.focus(); return; }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Messages from main thread ──────────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCAN_NOW') {
    e.waitUntil(bgScan(e.data.threshold || 11, e.data.notify !== false));
  }
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'PING') {
    if (e.source) e.source.postMessage({ type: 'PONG', ts: Date.now() });
  }
});

// ── Periodic Background Sync ───────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'humanlens-scan') e.waitUntil(bgScan(11, true));
});

// ── One-off Background Sync ────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'humanlens-bg-scan') e.waitUntil(bgScan(11, true));
});

// ── Fallback background scan (ticker-only, no klines) ─────────
async function bgScan(threshold, notify) {
  try {
    const [tickers, premiums] = await Promise.all([
      fetch(`${BASE}/fapi/v1/ticker/24hr`).then(r => r.json()),
      fetch(`${BASE}/fapi/v1/premiumIndex`).then(r => r.json()),
    ]);

    const fMap = {};
    premiums.forEach(p => { fMap[p.symbol] = parseFloat(p.lastFundingRate) * 100; });

    const alerts = [];
    for (const t of tickers) {
      if (!t.symbol.endsWith('USDT') || SKIP.has(t.symbol)) continue;
      if (+t.quoteVolume < 200000) continue;
      const ch = +t.priceChangePercent;
      const fr = fMap[t.symbol] || 0;
      const hlRange = (+t.highPrice - +t.lowPrice) / (+t.lowPrice || 1) * 100;
      const price = +t.lastPrice;
      let sc = 0, bias = 0;
      const sigs = [];

      if (Math.abs(ch) >= 25)  { sc += 4; sigs.push(`${ch > 0 ? '+' : ''}${ch.toFixed(0)}%`); bias += ch > 0 ? 2 : -2; }
      else if (Math.abs(ch) >= 15) { sc += 2; sigs.push(`${ch > 0 ? '+' : ''}${ch.toFixed(0)}%`); }
      else if (Math.abs(ch) >= 8)  { sc += 1; sigs.push(`${ch > 0 ? '+' : ''}${ch.toFixed(0)}%`); }
      if (Math.abs(fr) >= 0.08) { sc += 3; sigs.push(`FR${fr > 0 ? '+' : ''}${fr.toFixed(3)}%`); bias += fr < 0 ? 2 : -2; }
      else if (Math.abs(fr) >= 0.04) { sc += 1; sigs.push(`FR${fr > 0 ? '+' : ''}${fr.toFixed(3)}%`); }
      if (hlRange >= 45) { sc += 3; sigs.push(`HL${hlRange.toFixed(0)}%`); }
      else if (hlRange >= 28) { sc += 2; sigs.push(`HL${hlRange.toFixed(0)}%`); }
      else if (hlRange >= 18) { sc += 1; sigs.push(`HL${hlRange.toFixed(0)}%`); }
      if (price < 0.1 && +t.quoteVolume > 1e6) { sc += 1; sigs.push('low-float'); }

      if (sc >= threshold) {
        alerts.push({
          sym: t.symbol.replace('USDT', ''), score: sc, sigs,
          dir: bias > 0 ? 'PUMP' : bias < 0 ? 'DUMP' : 'MOVE',
          price, ch, fr
        });
      }
    }
    alerts.sort((a, b) => b.score - a.score);

    // Post to any open windows
    const cs = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of cs) c.postMessage({ type: 'BG_RESULTS', alerts, ts: Date.now() });

    // Show notification
    if (notify && alerts.length) {
      const top = alerts[0];
      const dir = top.dir === 'PUMP' ? '▲ PUMP' : '▼ DUMP';
      await self.registration.showNotification(`🎯 HumanLens — ${top.sym} ALERT`, {
        body: `${dir} · Score ${top.score}\n${top.sigs.join(' | ')}\n$${top.price}`,
        icon: '/icon.svg', badge: '/icon.svg',
        tag: `hl-${top.sym}`, renotify: true, requireInteraction: true,
        vibrate: [200, 100, 300, 100, 200],
        data: { url: '/', sym: top.sym },
        actions: [{ action: 'open', title: '📊 Open App' }]
      });
      if (alerts.length > 1) {
        await self.registration.showNotification(`+${alerts.length - 1} more signals`, {
          body: alerts.slice(1, 4).map(a => `${a.sym} ${a.dir} (${a.score})`).join(' · '),
          icon: '/icon.svg', badge: '/icon.svg', tag: 'hl-multi',
          data: { url: '/' }, vibrate: [100, 50, 100]
        });
      }
    }
    return alerts;
  } catch (e) {
    console.log('[SW] bgScan error:', e.message);
    return [];
  }
}

// Service Worker: يعمل التطبيق بدون إنترنت. بيانات Supabase لا تُخزَّن هنا أبدًا.
const V = 'att-v3';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co') || u.hostname.endsWith('supabase.in')) return;

  // الصفحة: الشبكة أولًا (لتصل التحديثات فورًا) ثم النسخة المخزّنة عند انقطاع الإنترنت
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put('index.html', cp)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // باقي الملفات والخطوط والمكتبات: من المخزن فورًا مع تحديثها في الخلفية
  if (u.origin === location.origin || /jsdelivr\.net|googleapis\.com|gstatic\.com/.test(u.hostname)) {
    e.respondWith(
      caches.match(r).then((hit) => {
        const net = fetch(r).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

// إشعارات التذكير (Web Push)
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { /* ignore */ }
  e.waitUntil(self.registration.showNotification(d.title || '⏰ تذكير الحضور', {
    body: d.body || 'سجّل حضور اليوم',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'att-reminder', dir: 'rtl', lang: 'ar',
    data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
    })
  );
});

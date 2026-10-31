// تذكير تسجيل الحضور (Web Push). يُستدعى من pg_cron كل 10 دقائق، ويتحقق من السر x-cron-secret.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

function localParts(tz: string, d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { ymd: `${p.year}-${p.month}-${p.day}`, ym: `${p.year}-${p.month}`, day: +p.day, min: (+p.hour % 24) * 60 + +p.minute, wd: p.weekday };
}

Deno.serve(async (req) => {
  const { data: cfg } = await sb.from('push_config').select('key,value');
  const c: Record<string, string> = Object.fromEntries((cfg || []).map((r: any) => [r.key, r.value]));
  if (!c.cron_secret || req.headers.get('x-cron-secret') !== c.cron_secret) return new Response('forbidden', { status: 403 });
  webpush.setVapidDetails(c.vapid_subject, c.vapid_public, c.vapid_private);

  const { data: subs } = await sb.from('att_push_subs').select('*');
  let sent = 0, skipped = 0, failed = 0, removed = 0;
  for (const s of subs || []) {
    try {
      const L = localParts(s.tz);
      const [h, m] = String(s.remind_time).split(':').map(Number);
      const target = h * 60 + m;
      if (L.min < target || L.min >= target + 40) { skipped++; continue; }
      if (s.last_sent === L.ymd) { skipped++; continue; }
      if (s.skip_friday && (L.wd === 'Fri' || L.wd === 'Sat')) { skipped++; continue; }

      // لو الحضور اتسجّل النهارده خلاص، مفيش تذكير
      const { data: doc } = await sb.from('attendance_docs').select('j').eq('user_id', s.user_id).eq('doc_key', 'm_' + L.ym).maybeSingle();
      let done = false;
      if (doc?.j) {
        try { const o = JSON.parse(doc.j); done = Object.keys(o).some((k) => k !== '_sh' && o[k]?.a && o[k].a[L.day]); } catch { /* ignore */ }
      }
      if (done) { await sb.from('att_push_subs').update({ last_sent: L.ymd }).eq('id', s.id); skipped++; continue; }

      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: '⏰ تذكير الحضور', body: 'لم يتم تسجيل حضور اليوم بعد. افتح الداشبورد وسجّل الحضور.', url: './' }),
        { TTL: 3600 }
      );
      await sb.from('att_push_subs').update({ last_sent: L.ymd }).eq('id', s.id);
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from('att_push_subs').delete().eq('id', s.id); removed++; }
      else { failed++; console.error('push failed', s.id, e?.statusCode, e?.message); }
    }
  }
  return Response.json({ sent, skipped, failed, removed, total: (subs || []).length });
});

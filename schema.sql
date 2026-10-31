-- ============ داشبورد الحضور: كل ما يلزم في Supabase (مطبّق بالفعل على مشروع warehouse-system) ============
-- يعتمد على الدالة public.get_my_role() الموجودة في المشروع (تفعيل الحسابات).

-- 1) المستندات: قائمة العاملين (roster) + شهر لكل مستند (m_YYYY-MM) + إعدادات القفل (cfg)
create table if not exists public.attendance_docs (
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_key text not null check (doc_key in ('roster','cfg') or doc_key like 'm\_%'),
  j text not null check (length(j) < 2000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_key)
);
alter table public.attendance_docs enable row level security;
revoke all on public.attendance_docs from anon, authenticated;
grant select, insert, update, delete on public.attendance_docs to authenticated;
create policy att_own on public.attendance_docs for all to authenticated
  using (user_id = (select auth.uid()) and (select public.get_my_role()) is not null)
  with check (user_id = (select auth.uid()) and (select public.get_my_role()) is not null);
alter publication supabase_realtime add table public.attendance_docs;

-- 2) سجل نسخ كل مستند (لاسترجاع صفحة/شهر/قائمة العاملين بمفردها)
create table if not exists public.attendance_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_key text not null, j text not null, size int not null,
  reason text not null default 'periodic',
  created_at timestamptz not null default now()
);
create index if not exists att_hist_idx on public.attendance_history(user_id, doc_key, created_at desc);
alter table public.attendance_history enable row level security;
revoke all on public.attendance_history from anon, authenticated;
grant select on public.attendance_history to authenticated;
create policy att_hist_sel on public.attendance_history for select to authenticated
  using (user_id = (select auth.uid()) and (select public.get_my_role()) is not null);

-- 3) نقاط استرجاع للموقع كله
create table if not exists public.attendance_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null, data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists att_cp_idx on public.attendance_checkpoints(user_id, created_at desc);
alter table public.attendance_checkpoints enable row level security;
revoke all on public.attendance_checkpoints from anon, authenticated;
grant select on public.attendance_checkpoints to authenticated;
create policy att_cp_sel on public.attendance_checkpoints for select to authenticated
  using (user_id = (select auth.uid()) and (select public.get_my_role()) is not null);

-- 4) الدوال والتريجر (att_docs_history, att_make_checkpoint, att_restore_checkpoint)
-- مطبّقة على المشروع في الـ migration رقم 05_attendance_history_checkpoints.
-- راجعها من: Supabase ← Database ← Migrations.

-- 5) المشاهدة فقط، سجل النشاط، التذكير (migration 06_attendance_roles_log_push) — مطبّقة بالفعل.
--    الجداول: att_members, attendance_log, att_push_subs, push_config
--    الدوال: att_share_add / att_share_remove / att_share_list
-- 6) دالة التذكير: supabase/functions/att-reminders/index.ts (منشورة، Verify JWT = OFF، تتحقق بسر x-cron-secret)
--    والجدولة: انظر cron.sql

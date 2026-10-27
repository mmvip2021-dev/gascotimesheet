-- جدول حفظ بيانات داشبورد الحضور (مطبّق بالفعل على مشروع warehouse-system)
-- كل مستخدم يرى بياناته فقط، والحساب لازم يكون مفعّلًا (profiles.is_active) عشان يحفظ.
create table if not exists public.attendance_docs (
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_key text not null check (doc_key = 'roster' or doc_key like 'm\_%'),
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

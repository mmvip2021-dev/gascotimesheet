-- LOQTA: run this AFTER loqta-schema.sql (Supabase > SQL Editor)

-- 1. "عروض نار" flag on products
alter table products add column if not exists is_hot boolean default false;

-- 2. Slider offers (banners) managed from the admin panel
create table if not exists banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  emoji text default '🛍️',
  link text default '#cats',
  active boolean default true,
  sort int default 0,
  created_at timestamptz default now()
);
alter table banners enable row level security;
create policy "banners read" on banners for select using (active or is_admin());
create policy "banners admin" on banners for all using (is_admin()) with check (is_admin());

-- 3. Product images bucket (public read, admin-only write)
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
create policy "product images read" on storage.objects for select using (bucket_id = 'products');
create policy "product images admin insert" on storage.objects for insert with check (bucket_id = 'products' and is_admin());
create policy "product images admin delete" on storage.objects for delete using (bucket_id = 'products' and is_admin());

-- 4. Make yourself admin:
--    a) Supabase > Authentication > Users > Add user (your email + a strong password, tick "Auto confirm")
--    b) then run (with your email):
-- update profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');

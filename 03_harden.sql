-- Applied to the live project after 01 and 02 (clears Supabase security advisor warnings).
-- If you re-create the project from these files, run this last.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.is_admin() set schema private;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;
-- Note: 01 creates admin_stats without security_invoker; the live project uses:
--   create view admin_stats with (security_invoker = true) as ...

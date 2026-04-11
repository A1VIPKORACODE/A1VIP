-- Run this in Supabase SQL Editor
-- This version keeps public reads open, but restricts all writes to authenticated users
-- whose JWT contains app_metadata.role = 'admin'.

alter table if exists public.codes enable row level security;
alter table if exists public.daily_stats enable row level security;
alter table if exists public.app_state enable row level security;

-- Remove old policies if they exist

drop policy if exists "Public read codes" on public.codes;
drop policy if exists "Admins write codes" on public.codes;
drop policy if exists "Public read daily_stats" on public.daily_stats;
drop policy if exists "Admins write daily_stats" on public.daily_stats;
drop policy if exists "Public read app_state" on public.app_state;
drop policy if exists "Admins write app_state" on public.app_state;

drop policy if exists "Public read codes bucket" on storage.objects;
drop policy if exists "Public insert codes bucket" on storage.objects;
drop policy if exists "Public update codes bucket" on storage.objects;
drop policy if exists "Public delete codes bucket" on storage.objects;
drop policy if exists "Public read storage codes" on storage.objects;
drop policy if exists "Admins write storage codes" on storage.objects;

create policy "Public read codes"
on public.codes
for select
using (true);

create policy "Admins write codes"
on public.codes
for all
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Public read daily_stats"
on public.daily_stats
for select
using (true);

create policy "Admins write daily_stats"
on public.daily_stats
for all
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Public read app_state"
on public.app_state
for select
using (true);

create policy "Admins write app_state"
on public.app_state
for all
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

create policy "Public read storage codes"
on storage.objects
for select
using (bucket_id = 'codes');

create policy "Admins write storage codes"
on storage.objects
for all
using (
  bucket_id = 'codes'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  bucket_id = 'codes'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

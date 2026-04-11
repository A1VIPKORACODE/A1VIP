-- Run this in Supabase SQL Editor
-- Public read access remains open for site pages.
-- Write access is restricted to authenticated users only.

alter table if exists public.codes enable row level security;
alter table if exists public.daily_stats enable row level security;
alter table if exists public.app_state enable row level security;

drop policy if exists "Public read codes" on public.codes;
drop policy if exists "Authenticated write codes" on public.codes;
drop policy if exists "Public read daily_stats" on public.daily_stats;
drop policy if exists "Authenticated write daily_stats" on public.daily_stats;
drop policy if exists "Public read app_state" on public.app_state;
drop policy if exists "Authenticated write app_state" on public.app_state;

drop policy if exists "Public read codes bucket" on storage.objects;
drop policy if exists "Public insert codes bucket" on storage.objects;
drop policy if exists "Public update codes bucket" on storage.objects;
drop policy if exists "Public delete codes bucket" on storage.objects;
drop policy if exists "Public read storage codes" on storage.objects;
drop policy if exists "Authenticated write storage codes" on storage.objects;

create policy "Public read codes"
on public.codes
for select
using (true);

create policy "Authenticated write codes"
on public.codes
for all
to authenticated
using (true)
with check (true);

create policy "Public read daily_stats"
on public.daily_stats
for select
using (true);

create policy "Authenticated write daily_stats"
on public.daily_stats
for all
to authenticated
using (true)
with check (true);

create policy "Public read app_state"
on public.app_state
for select
using (true);

create policy "Authenticated write app_state"
on public.app_state
for all
to authenticated
using (true)
with check (true);

create policy "Public read storage codes"
on storage.objects
for select
using (bucket_id = 'codes');

create policy "Authenticated write storage codes"
on storage.objects
for all
to authenticated
using (bucket_id = 'codes')
with check (bucket_id = 'codes');

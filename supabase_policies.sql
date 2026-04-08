-- Run this once in Supabase SQL Editor
alter table if exists public.tip_codes disable row level security;
alter table if exists public.daily_stats disable row level security;
alter table if exists public.app_state disable row level security;

-- Storage policies for the public bucket `codes`
create policy "Public read codes bucket"
on storage.objects for select
using (bucket_id = 'codes');

create policy "Public insert codes bucket"
on storage.objects for insert
with check (bucket_id = 'codes');

create policy "Public update codes bucket"
on storage.objects for update
using (bucket_id = 'codes')
with check (bucket_id = 'codes');

create policy "Public delete codes bucket"
on storage.objects for delete
using (bucket_id = 'codes');

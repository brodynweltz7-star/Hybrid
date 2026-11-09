-- Run in your Supabase project's SQL Editor.
create table if not exists public.widget_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.widget_snapshots enable row level security;
revoke all on public.widget_snapshots from anon;
grant select, insert, update on public.widget_snapshots to authenticated;
drop policy if exists "Read own widget snapshot" on public.widget_snapshots;
create policy "Read own widget snapshot" on public.widget_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own widget snapshot" on public.widget_snapshots;
create policy "Insert own widget snapshot" on public.widget_snapshots
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own widget snapshot" on public.widget_snapshots;
create policy "Update own widget snapshot" on public.widget_snapshots
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

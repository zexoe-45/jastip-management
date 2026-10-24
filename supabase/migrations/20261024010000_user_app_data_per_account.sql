-- Store the current app's customer, batch, order and settings collections per authenticated user.
-- Each row is protected by RLS; users can only access their own data.
create table if not exists public.user_app_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('customers','batches','orders','settings')),
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);
alter table public.user_app_data enable row level security;
drop policy if exists "Users can read own app data" on public.user_app_data;
create policy "Users can read own app data" on public.user_app_data
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own app data" on public.user_app_data;
create policy "Users can insert own app data" on public.user_app_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own app data" on public.user_app_data;
create policy "Users can update own app data" on public.user_app_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own app data" on public.user_app_data;
create policy "Users can delete own app data" on public.user_app_data
  for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.user_app_data to authenticated;

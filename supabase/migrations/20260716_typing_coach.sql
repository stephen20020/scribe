-- Typing coach: aggregate mistake summaries + cloud typing profile
-- Never stores raw Scripture text — only counts / pair keys.

alter table public.typing_sessions
  add column if not exists mistake_summary jsonb;

create table if not exists public.typing_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.typing_profiles enable row level security;

drop policy if exists "typing_profiles_select_own" on public.typing_profiles;
drop policy if exists "typing_profiles_upsert_own" on public.typing_profiles;
drop policy if exists "typing_profiles_update_own" on public.typing_profiles;

create policy "typing_profiles_select_own"
  on public.typing_profiles for select
  using (auth.uid() = user_id);

create policy "typing_profiles_upsert_own"
  on public.typing_profiles for insert
  with check (auth.uid() = user_id);

create policy "typing_profiles_update_own"
  on public.typing_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

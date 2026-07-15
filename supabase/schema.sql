-- Reps gym tracker — run this once in your Supabase project's SQL Editor.
-- Creates the two sync tables with row-level security so each account can
-- only ever see its own rows (the anon key alone grants nothing).

create table if not exists public.exercises (
  user_id    uuid    not null default auth.uid(),
  id         text    not null,
  name       text    not null,
  muscle     text    not null,
  equipment  text    not null,
  notes      text    not null default '',
  custom     boolean not null default true,
  updated_at bigint  not null default 0,  -- epoch ms, drives cross-device merge
  primary key (user_id, id)
);

create table if not exists public.sessions (
  user_id      uuid    not null default auth.uid(),
  id           text    not null,
  name         text    not null,
  date_key     text    not null,           -- YYYY-MM-DD local date
  started_at   bigint  not null,           -- epoch ms
  duration_min integer not null,
  volume_kg    numeric not null,
  pr_count     integer not null,
  exercises    jsonb   not null,           -- [{exerciseId, sets:[{kg,reps}]}]
  primary key (user_id, id)
);

alter table public.exercises enable row level security;
alter table public.sessions  enable row level security;

create policy "own exercises" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

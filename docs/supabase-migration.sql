-- KSaju analytics_events table
-- Run this in the Supabase SQL Editor for your project.
-- Idempotent: safe to re-run.

create table if not exists analytics_events (
  id         uuid        primary key default gen_random_uuid(),
  event      text        not null,
  props      jsonb,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table analytics_events enable row level security;

-- Allow anonymous users to insert events (anon key is public by design)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'analytics_events' and policyname = 'allow anon insert'
  ) then
    create policy "allow anon insert"
      on analytics_events
      for insert
      with check (true);
  end if;
end $$;

-- Daily Fortune cache table (cycle 23)
create table if not exists daily_fortunes (
  id           uuid        primary key default gen_random_uuid(),
  date         date        not null,
  day_master   text        not null,
  today_pillar text        not null,
  relation     text        not null,
  message      text        not null,
  energy       integer     not null check (energy >= 1 and energy <= 5),
  lucky_color  text        not null,
  created_at   timestamptz not null default now(),
  unique(date, day_master)
);

-- Enable RLS (server-only table — service role key bypasses RLS entirely)
-- No anon/authenticated policies needed; direct client access is intentionally blocked.
alter table daily_fortunes enable row level security;

-- Anonymous user identity table (cycle 26)
-- uid = crypto.randomUUID() generated on device; stored in localStorage ksaju_uid
-- Service role reads/writes bypass RLS. Anon key uses policies below.
create table if not exists anon_users (
  uid        text        primary key,
  birthdate  date        not null,
  birth_time time,
  timezone   text        not null default 'Asia/Seoul',
  day_master text,
  email      text,
  last_visit timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table anon_users enable row level security;

-- uid is a client-generated UUID (unguessable) — allow anon full CRUD on own row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon insert'
  ) then
    create policy "anon_users: anon insert"
      on anon_users for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon select'
  ) then
    create policy "anon_users: anon select"
      on anon_users for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon update'
  ) then
    create policy "anon_users: anon update"
      on anon_users for update to anon using (true) with check (true);
  end if;
end $$;

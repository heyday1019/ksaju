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

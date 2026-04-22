-- Run in Supabase SQL editor or via CLI migrate
alter table public.sessions
  add column if not exists beginner_friendly boolean not null default false;

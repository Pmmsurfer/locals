-- Run in Supabase SQL editor (public waitlist for landing page)
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  email text unique not null,
  neighborhood text, -- stores selected city from landing waitlist
  activity text
);

alter table waitlist enable row level security;

create policy "anyone can join waitlist" on waitlist
  for insert with check (true);

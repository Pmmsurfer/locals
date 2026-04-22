alter table public.sessions
  add column if not exists contact_info text;

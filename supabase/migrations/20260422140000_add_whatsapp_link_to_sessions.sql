alter table public.sessions
  add column if not exists whatsapp_link text;

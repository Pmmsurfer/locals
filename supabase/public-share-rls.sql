-- Optional policies so /s/[id] works for anonymous visitors and OG crawlers.
-- Review in your project context; adjust if policies already exist.

-- Allow public read of sessions (tighten with USING (status <> 'cancelled') if desired)
-- drop policy if exists "sessions_select_public_share";
-- create policy "sessions_select_public_share" on public.sessions
--   for select to anon, authenticated using (true);

-- Allow public read of joined participants for a session
-- create policy "session_participants_select_public_share" on public.session_participants
--   for select to anon, authenticated using (status = 'joined');

-- Profiles: hosts and attendees must be readable for share page.
-- Example (broad): allow select for rows that appear as creators or participants.
-- create policy "profiles_select_for_sessions" on public.profiles
--   for select to anon, authenticated using (
--     exists (select 1 from public.sessions s where s.creator_id = profiles.id)
--     or exists (
--       select 1 from public.session_participants sp
--       where sp.user_id = profiles.id and sp.status = 'joined'
--     )
--   );

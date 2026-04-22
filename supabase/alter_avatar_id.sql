-- Run in Supabase SQL editor (or migrate):
alter table profiles add column if not exists avatar_id text default 'bear';

-- Optional: backfill for existing users with null
update profiles set avatar_id = 'bear' where avatar_id is null;

-- Feed RPC: add `creator_avatar_id` (text) to the return type of `nearby_sessions` by
-- joining the sessions row to `profiles` on `sessions.creator_id = profiles.id` and
-- selecting `profiles.avatar_id` as `creator_avatar_id`. Until this is deployed, the
-- app falls back to initials on session cards.

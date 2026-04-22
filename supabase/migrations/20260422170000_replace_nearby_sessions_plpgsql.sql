-- Align with production: future starts, privacy, plpgsql body.
-- Also keep feed fields the app expects: beginner_friendly, whatsapp_link, creator_avatar_id.

alter table public.sessions
  add column if not exists privacy text default 'public';

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'nearby_sessions'
      and n.nspname = 'public'
  loop
    execute 'drop function ' || r.fn || ' cascade';
  end loop;
end$$;

create or replace function public.nearby_sessions(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision default 10000,
  filter_activity text default null
)
returns table (
  id uuid,
  title text,
  activity activity_type,
  starts_at timestamptz,
  duration_minutes int,
  location_name text,
  address text,
  pace_level pace_level,
  spots_filled int,
  max_spots int,
  status session_status,
  creator_id uuid,
  creator_full_name text,
  creator_username text,
  creator_avatar_url text,
  distance_meters double precision,
  description text,
  instructions text,
  is_free boolean,
  price_amount int,
  price_link text,
  beginner_friendly boolean,
  whatsapp_link text,
  creator_avatar_id text,
  privacy text
)
language plpgsql
stable
as $func$
begin
  return query
  select
    s.id,
    s.title,
    s.activity,
    s.starts_at,
    s.duration_minutes,
    s.location_name,
    s.address,
    s.pace_level,
    s.spots_filled,
    s.max_spots,
    s.status,
    s.creator_id,
    p.full_name as creator_full_name,
    p.username as creator_username,
    p.avatar_url as creator_avatar_url,
    st_distance(
      s.location::geography,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    )::double precision as distance_meters,
    s.description,
    s.instructions,
    s.is_free,
    s.price_amount,
    s.price_link,
    s.beginner_friendly,
    s.whatsapp_link,
    p.avatar_id::text as creator_avatar_id,
    s.privacy
  from public.sessions s
  join public.profiles p on p.id = s.creator_id
  where
    s.status = 'open'
    and s.starts_at > now()
    and s.location is not null
    and st_dwithin(
      s.location::geography,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
    and (filter_activity is null or s.activity::text = filter_activity)
    and (s.privacy = 'public' or s.privacy is null)
  order by s.starts_at asc;
end;
$func$;

grant execute on function public.nearby_sessions(
  double precision,
  double precision,
  double precision,
  text
) to authenticated, anon;

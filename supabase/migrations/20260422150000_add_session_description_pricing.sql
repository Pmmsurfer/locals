-- Sessions: optional copy + free/paid fields for feed, share, and post flow.

alter table public.sessions
  add column if not exists description text;

alter table public.sessions
  add column if not exists instructions text;

alter table public.sessions
  add column if not exists is_free boolean not null default true;

alter table public.sessions
  add column if not exists price_amount int not null default 0;

alter table public.sessions
  add column if not exists price_link text;

-- Recreate `nearby_sessions` so the return row includes the new columns.
-- Drops all overloads of the same name (signatures may differ by environment).
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
  radius_meters double precision,
  filter_activity text
)
returns table (
  id uuid,
  creator_id uuid,
  activity text,
  title text,
  description text,
  starts_at timestamptz,
  duration_minutes int,
  location_name text,
  address text,
  pace_level text,
  beginner_friendly boolean,
  max_spots int,
  spots_filled int,
  status text,
  whatsapp_link text,
  instructions text,
  is_free boolean,
  price_amount int,
  price_link text,
  creator_full_name text,
  creator_username text,
  creator_avatar_url text,
  creator_avatar_id text,
  distance_meters double precision
)
language sql
stable
as $$
  select
    s.id,
    s.creator_id,
    s.activity::text,
    s.title,
    s.description,
    s.starts_at,
    s.duration_minutes,
    s.location_name,
    s.address,
    s.pace_level::text,
    s.beginner_friendly,
    s.max_spots,
    s.spots_filled,
    s.status::text,
    s.whatsapp_link,
    s.instructions,
    s.is_free,
    s.price_amount,
    s.price_link,
    p.full_name as creator_full_name,
    p.username as creator_username,
    p.avatar_url as creator_avatar_url,
    p.avatar_id::text as creator_avatar_id,
    case
      when s.location is not null then
        st_distance(
          s.location::geography,
          st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
        )::double precision
      else null
    end as distance_meters
  from public.sessions s
  left join public.profiles p on p.id = s.creator_id
  where
    s.status = 'open'
    and s.location is not null
    and st_dwithin(
      s.location::geography,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
    and (filter_activity is null or s.activity::text = filter_activity)
  order by distance_meters nulls last, s.starts_at asc;
$$;

grant execute on function public.nearby_sessions(
  double precision,
  double precision,
  double precision,
  text
) to authenticated, anon;

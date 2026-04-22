-- Session activity enum (used by `sessions.activity` and `nearby_sessions` filter)
alter type activity_type add value if not exists 'swimming';
alter type activity_type add value if not exists 'social';

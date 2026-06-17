-- Run in Supabase SQL Editor

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  session_id text not null,
  event_name text not null,
  properties jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists events_event_name_idx on events(event_name);
create index if not exists events_created_at_idx on events(created_at desc);
create index if not exists events_user_id_idx on events(user_id);
create index if not exists events_session_id_idx on events(session_id);

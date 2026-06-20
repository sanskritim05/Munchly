create table if not exists saved_taste_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  restaurant text not null,
  dish text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant, dish)
);

create index if not exists saved_taste_picks_user_created_idx
  on saved_taste_picks (user_id, created_at desc);

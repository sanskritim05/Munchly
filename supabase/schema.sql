-- PlateCheck: run in Supabase SQL Editor
-- Also create Storage bucket "plates" (public) in Dashboard → Storage

create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  total_plates int default 0,
  average_score numeric(4,2) default 0,
  follower_count int default 0,
  onboarding_complete boolean default false,
  onboarding_ratings_count int default 0,
  created_at timestamptz default now()
);

create table if not exists plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  dish_name text,
  restaurant_name text,
  location_text text,
  ai_roast text,
  score numeric(4,2) default 0,
  hot_count int default 0,
  not_count int default 0,
  view_count int default 0,
  share_view_count int default 0,
  comment_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references plates(id) on delete cascade,
  rater_id uuid references profiles(id) on delete cascade,
  rating int not null check (rating in (1, 0)),
  created_at timestamptz default now(),
  unique(plate_id, rater_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references plates(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  like_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists comment_likes (
  comment_id uuid references comments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table if not exists leaderboard_weekly (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid references plates(id),
  user_id uuid references profiles(id),
  week_start date not null,
  score numeric(4,2),
  hot_count int,
  rank int,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  session_id text not null,
  event_name text not null,
  properties jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists plates_user_id_idx on plates(user_id);
create index if not exists plates_created_at_idx on plates(created_at desc);
create index if not exists ratings_plate_id_idx on ratings(plate_id);
create index if not exists ratings_rater_id_idx on ratings(rater_id);
create index if not exists comments_parent_id_idx on comments(parent_id);
create index if not exists comment_likes_user_id_idx on comment_likes(user_id);
create index if not exists events_event_name_idx on events(event_name);
create index if not exists events_created_at_idx on events(created_at desc);
create index if not exists events_user_id_idx on events(user_id);
create index if not exists events_session_id_idx on events(session_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, onboarding_complete)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', 'Foodie'),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;
alter table plates enable row level security;
alter table ratings enable row level security;
alter table comments enable row level security;
alter table comment_likes enable row level security;
alter table follows enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Plates are viewable by everyone" on plates;
drop policy if exists "Users can insert own plates" on plates;
create policy "Plates are viewable by everyone" on plates for select using (true);
create policy "Users can insert own plates" on plates for insert with check (auth.uid() = user_id);
create policy "Users can update own plates" on plates for update using (auth.uid() = user_id);

drop policy if exists "Ratings are viewable by everyone" on ratings;
drop policy if exists "Users can insert own ratings" on ratings;
create policy "Ratings are viewable by everyone" on ratings for select using (true);
create policy "Users can insert own ratings" on ratings for insert with check (auth.uid() = rater_id);

drop policy if exists "Comments are viewable by everyone" on comments;
drop policy if exists "Users can insert own comments" on comments;
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Users can insert own comments" on comments for insert with check (auth.uid() = user_id);

drop policy if exists "Comment likes are viewable by everyone" on comment_likes;
drop policy if exists "Users can insert own comment likes" on comment_likes;
drop policy if exists "Users can delete own comment likes" on comment_likes;
create policy "Comment likes are viewable by everyone" on comment_likes for select using (true);
create policy "Users can insert own comment likes" on comment_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own comment likes" on comment_likes for delete using (auth.uid() = user_id);

drop policy if exists "Follows are viewable by everyone" on follows;
drop policy if exists "Users can insert own follows" on follows;
drop policy if exists "Users can delete own follows" on follows;
create policy "Follows are viewable by everyone" on follows for select using (true);
create policy "Users can insert own follows" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can delete own follows" on follows for delete using (auth.uid() = follower_id);

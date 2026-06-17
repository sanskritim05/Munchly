-- Run in Supabase SQL Editor (upgrades existing projects)

alter table comments add column if not exists parent_id uuid references comments(id) on delete cascade;
alter table comments add column if not exists like_count int not null default 0;

create table if not exists comment_likes (
  comment_id uuid references comments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

create index if not exists comments_parent_id_idx on comments(parent_id);
create index if not exists comment_likes_user_id_idx on comment_likes(user_id);

alter table comment_likes enable row level security;

drop policy if exists "Comment likes are viewable by everyone" on comment_likes;
drop policy if exists "Users can insert own comment likes" on comment_likes;
drop policy if exists "Users can delete own comment likes" on comment_likes;
create policy "Comment likes are viewable by everyone" on comment_likes for select using (true);
create policy "Users can insert own comment likes" on comment_likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own comment likes" on comment_likes for delete using (auth.uid() = user_id);

drop policy if exists "Users can update own plates" on plates;
create policy "Users can update own plates" on plates for update using (auth.uid() = user_id);

-- Users can only see who they follow, not who follows them.
drop policy if exists "Follows are viewable by everyone" on follows;
create policy "Users can view own follows" on follows
  for select using (auth.uid() = follower_id);

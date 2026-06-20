-- Auto-follow the official munchly account for all existing users.
insert into follows (follower_id, following_id)
select p.id, m.id
from profiles p
cross join profiles m
where m.username = 'munchly'
  and p.id != m.id
  and not exists (
    select 1
    from follows f
    where f.follower_id = p.id
      and f.following_id = m.id
  );

update profiles
set follower_count = (
  select count(*)
  from follows
  where following_id = profiles.id
)
where username = 'munchly';

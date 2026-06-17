-- Remove mock/demo users and plates from Supabase before publishing.
-- Run in Supabase SQL Editor (deletes cascade to profiles, plates, ratings, etc.)

delete from plates
where image_url ilike '%/mock-plates/%'
   or image_url ilike '%mock-plate%';

delete from leaderboard_weekly
where plate_id is null
   or plate_id not in (select id from plates where is_active = true);

delete from auth.users
where email ilike '%@platecheck.test'
   or email ilike '%@ratemyplate.test';

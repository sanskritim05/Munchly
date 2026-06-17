-- Full reset: run in Supabase SQL Editor (Dashboard → SQL)
-- Clears all app data. Auth users must be removed via scripts/reset-database.mjs
-- or Supabase Dashboard → Authentication → Users.

truncate table comment_likes, comments, ratings, follows, leaderboard_weekly, events, plates, profiles cascade;

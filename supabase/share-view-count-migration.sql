-- Run in Supabase SQL Editor to track share link page views separately from view_count

alter table plates add column if not exists share_view_count int default 0;

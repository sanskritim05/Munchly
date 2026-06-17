-- Run once if profiles table already exists without onboarding_complete
alter table profiles add column if not exists onboarding_complete boolean default false;

-- Mark existing accounts as onboarded (optional, for dev databases)
-- update profiles set onboarding_complete = true;

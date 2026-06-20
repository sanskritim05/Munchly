-- Reserve munchly for the brand account and rename the legacy platecheck handle.
update public.profiles
set
  username = 'munchly',
  username_changed_at = null
where username = 'platecheck';

-- Remove profile name/username change cooldowns.
create or replace function public.enforce_profile_identity_cooldown()
returns trigger as $$
begin
  if new.username is distinct from old.username then
    new.username_changed_at := now();
  end if;

  if new.display_name is distinct from old.display_name then
    new.display_name_changed_at := now();
  end if;

  return new;
end;
$$ language plpgsql;

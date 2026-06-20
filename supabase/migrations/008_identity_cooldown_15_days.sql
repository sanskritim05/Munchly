-- Reduce profile name/username change cooldown from 30 to 15 days.
create or replace function public.enforce_profile_identity_cooldown()
returns trigger as $$
declare
  cooldown interval := interval '15 days';
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at + cooldown > now() then
      raise exception 'Username can only be changed once every 15 days';
    end if;
    new.username_changed_at := now();
  end if;

  if new.display_name is distinct from old.display_name then
    if old.display_name_changed_at is not null and old.display_name_changed_at + cooldown > now() then
      raise exception 'Display name can only be changed once every 15 days';
    end if;
    new.display_name_changed_at := now();
  end if;

  return new;
end;
$$ language plpgsql;

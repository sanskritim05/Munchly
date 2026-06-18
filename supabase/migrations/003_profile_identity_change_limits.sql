alter table profiles
  add column if not exists username_changed_at timestamptz,
  add column if not exists display_name_changed_at timestamptz;

create or replace function public.enforce_profile_identity_cooldown()
returns trigger as $$
declare
  cooldown interval := interval '30 days';
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at + cooldown > now() then
      raise exception 'Username can only be changed once per month';
    end if;
    new.username_changed_at := now();
  end if;

  if new.display_name is distinct from old.display_name then
    if old.display_name_changed_at is not null and old.display_name_changed_at + cooldown > now() then
      raise exception 'Display name can only be changed once per month';
    end if;
    new.display_name_changed_at := now();
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_identity_cooldown on profiles;
create trigger profiles_identity_cooldown
  before update on profiles
  for each row execute function public.enforce_profile_identity_cooldown();

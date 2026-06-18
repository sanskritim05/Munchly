import type { User } from "@supabase/supabase-js";

export function isRegisteredUser(user: User | null | undefined): user is User {
  return Boolean(user && !user.is_anonymous);
}

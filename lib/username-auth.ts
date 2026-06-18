import { normalizeUsername } from "@/lib/username";
import type { SupabaseClient } from "@supabase/supabase-js";

const AUTH_EMAIL_DOMAIN = "users.platecheck.app";

export const PASSWORD_MIN_LENGTH = 6;

export function usernameAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

export function isValidPassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export async function updateAuthUsernameEmail(
  supabase: SupabaseClient,
  userId: string,
  username: string
) {
  return supabase.auth.admin.updateUserById(userId, {
    email: usernameAuthEmail(username),
    email_confirm: true,
  });
}

export function usernameAuthErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered")) {
    return "Username already taken";
  }
  return message;
}

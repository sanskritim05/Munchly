import { normalizeUsername } from "@/lib/username";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

const AUTH_EMAIL_DOMAIN = "users.platecheck.app";

export const PASSWORD_MIN_LENGTH = 6;

export function usernameAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

export function authEmailUsername(email: string | null | undefined) {
  if (!email) return null;

  const suffix = `@${AUTH_EMAIL_DOMAIN}`;
  if (!email.endsWith(suffix)) return null;

  return email.slice(0, -suffix.length);
}

export function isValidPassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export async function syncAuthEmailForUsername(
  supabase: SupabaseClient,
  userId: string,
  username: string
) {
  const normalized = normalizeUsername(username);
  const email = usernameAuthEmail(normalized);

  const { data: current, error: currentError } = await supabase.auth.admin.getUserById(userId);
  if (currentError) {
    return { data: null, error: currentError };
  }

  if (current?.user?.email === email) {
    return { data: current.user, error: null };
  }

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
    user_metadata: {
      ...current?.user?.user_metadata,
      username: normalized,
    },
  });

  if (error) {
    return { data: null, error };
  }

  if (data.user?.email !== email) {
    return {
      data: null,
      error: {
        message: "Failed to sync login email for this username",
      } as AuthError,
    };
  }

  return { data: data.user, error: null };
}

export async function updateAuthUsernameEmail(
  supabase: SupabaseClient,
  userId: string,
  username: string
) {
  return syncAuthEmailForUsername(supabase, userId, username);
}

export function usernameAuthErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered")) {
    return "Username already taken";
  }
  return message;
}

export async function repairUsernameAuthLogin(
  admin: SupabaseClient,
  signInClient: SupabaseClient,
  username: string,
  password: string
) {
  const normalized = normalizeUsername(username);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username")
    .eq("username", normalized)
    .maybeSingle();

  if (!profile) return null;

  const targetEmail = usernameAuthEmail(profile.username);
  const { data: authData } = await admin.auth.admin.getUserById(profile.id);
  const currentEmail = authData?.user?.email;

  const { data: targetSignIn, error: targetError } =
    await signInClient.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

  if (!targetError && targetSignIn.session) {
    return targetSignIn.session;
  }

  if (!currentEmail || currentEmail === targetEmail) {
    return null;
  }

  const { data: legacySignIn, error: legacyError } = await signInClient.auth.signInWithPassword({
    email: currentEmail,
    password,
  });

  if (legacyError || !legacySignIn.session) {
    return null;
  }

  const { error: syncError } = await syncAuthEmailForUsername(admin, profile.id, profile.username);
  if (syncError) {
    return legacySignIn.session;
  }

  const { data: refreshedSignIn, error: refreshedError } =
    await signInClient.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

  if (refreshedError || !refreshedSignIn.session) {
    return legacySignIn.session;
  }

  return refreshedSignIn.session;
}

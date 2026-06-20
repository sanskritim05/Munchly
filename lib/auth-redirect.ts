import { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_POST_AUTH_PATH = "/swipe";

const LOGIN_RETURN_OVERRIDES = new Set(["/profile/settings"]);

export function resolveAuthNext(next: string | null | undefined): string {
  const raw = next?.trim() || DEFAULT_POST_AUTH_PATH;
  const path = raw.split("?")[0] || DEFAULT_POST_AUTH_PATH;

  if (LOGIN_RETURN_OVERRIDES.has(path)) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return raw || DEFAULT_POST_AUTH_PATH;
}

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
  _isAnonymous: boolean,
  next: string
) {
  const destination = resolveAuthNext(next);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.onboarding_complete) {
    return `/get-started?next=${encodeURIComponent(destination)}`;
  }

  return destination;
}

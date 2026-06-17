import { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
  _isAnonymous: boolean,
  next: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.onboarding_complete) {
    return `/get-started?next=${encodeURIComponent(next)}`;
  }

  return next;
}

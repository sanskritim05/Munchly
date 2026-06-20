import type { SupabaseClient } from "@supabase/supabase-js";
import { isVerifiedProfile } from "@/lib/profile-verified";

export const PROFILE_SEARCH_MIN_LENGTH = 2;
export const PROFILE_SEARCH_LIMIT = 12;

export interface ProfileSearchResult {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  averageScore: number;
  totalPlates: number;
  verified: boolean;
}

export function normalizeProfileSearchQuery(query: string) {
  return query.trim().replace(/[%_]/g, "");
}

export async function searchProfiles(
  supabase: SupabaseClient,
  query: string,
  limit = PROFILE_SEARCH_LIMIT
): Promise<ProfileSearchResult[]> {
  const term = normalizeProfileSearchQuery(query);
  if (term.length < PROFILE_SEARCH_MIN_LENGTH) return [];

  const pattern = `%${term.replace(/"/g, "")}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, average_score, total_plates")
    .eq("onboarding_complete", true)
    .or(`username.ilike."${pattern}",display_name.ilike."${pattern}"`)
    .order("username", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((profile) => ({
    username: profile.username,
    displayName: profile.display_name?.trim() || null,
    avatarUrl: profile.avatar_url,
    averageScore: Number(profile.average_score ?? 0),
    totalPlates: profile.total_plates ?? 0,
    verified: isVerifiedProfile(profile),
  }));
}

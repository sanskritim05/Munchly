import type { SupabaseClient } from "@supabase/supabase-js";
import { UNLIMITED_PLATE_USERNAME } from "@/lib/plate-limits";

export async function getOfficialProfileId(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", UNLIMITED_PLATE_USERNAME)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getFollowerCount(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (error) return 0;
  return count ?? 0;
}

export async function syncFollowerCount(supabase: SupabaseClient, userId: string) {
  const followerCount = await getFollowerCount(supabase, userId);
  await supabase.from("profiles").update({ follower_count: followerCount }).eq("id", userId);
  return followerCount;
}

export async function ensureFollowsOfficialAccount(supabase: SupabaseClient, userId: string) {
  const officialId = await getOfficialProfileId(supabase);
  if (!officialId || officialId === userId) return;

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", officialId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("follows").insert({
    follower_id: userId,
    following_id: officialId,
  });

  if (!error) {
    await syncFollowerCount(supabase, officialId);
  }
}

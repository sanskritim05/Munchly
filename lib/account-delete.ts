import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeUsername } from "@/lib/username";
import { UNLIMITED_PLATE_USERNAME } from "@/lib/plate-limits";

async function listStoragePaths(
  supabase: SupabaseClient,
  prefix: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from("plates").list(prefix, {
    limit: 1000,
  });

  if (error || !data?.length) return [];

  const paths: string[] = [];

  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      paths.push(path);
    } else {
      paths.push(...(await listStoragePaths(supabase, path)));
    }
  }

  return paths;
}

export async function removeUserStorage(
  supabase: SupabaseClient,
  userId: string
) {
  const paths = await listStoragePaths(supabase, userId);
  if (paths.length === 0) return;

  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from("plates").remove(batch);
    if (error) throw error;
  }
}

export function isAccountDeletionBlocked(username: string | null | undefined) {
  return normalizeUsername(username ?? "") === UNLIMITED_PLATE_USERNAME;
}

export async function deleteUserAccount(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (isAccountDeletionBlocked(profile?.username)) {
    throw new Error("This account cannot be deleted.");
  }

  const { data: plates } = await supabase
    .from("plates")
    .select("id")
    .eq("user_id", userId);

  const plateIds = (plates ?? []).map((plate) => plate.id);

  if (plateIds.length > 0) {
    const { error: leaderboardError } = await supabase
      .from("leaderboard_weekly")
      .delete()
      .in("plate_id", plateIds);

    if (leaderboardError) throw leaderboardError;
  }

  const { error: leaderboardUserError } = await supabase
    .from("leaderboard_weekly")
    .delete()
    .eq("user_id", userId);

  if (leaderboardUserError) throw leaderboardUserError;

  await removeUserStorage(supabase, userId);

  const { error: profileDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) throw profileDeleteError;

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  if (authDeleteError) throw authDeleteError;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export const LEADERBOARD_LIMIT = 10;
export const LEADERBOARD_LOOKBACK_DAYS = 7;
export const LEADERBOARD_MIN_VOTES = 3;
export const LEADERBOARD_FALLBACK_MIN_VOTES = 1;

export interface LeaderboardEntry {
  plateId: string;
  rank: number;
  score: number;
  imageUrl: string | null;
  dishName: string | null;
  username: string;
}

export function getWeekStartDate(date = new Date()) {
  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  return weekStart.toISOString().slice(0, 10);
}

export function getLookbackSince(date = new Date()) {
  const since = new Date(date);
  since.setUTCDate(since.getUTCDate() - LEADERBOARD_LOOKBACK_DAYS);
  return since.toISOString();
}

export function voteCount(plate: { hot_count?: number | null; not_count?: number | null }) {
  return (plate.hot_count ?? 0) + (plate.not_count ?? 0);
}

export function rankEligiblePlates<
  T extends { score: number | string; hot_count?: number | null; not_count?: number | null },
>(plates: T[]) {
  const sorted = [...plates].sort((a, b) => Number(b.score) - Number(a.score));
  let eligible = sorted.filter((plate) => voteCount(plate) >= LEADERBOARD_MIN_VOTES);

  if (eligible.length < LEADERBOARD_LIMIT) {
    const extras = sorted.filter(
      (plate) =>
        voteCount(plate) >= LEADERBOARD_FALLBACK_MIN_VOTES &&
        voteCount(plate) < LEADERBOARD_MIN_VOTES
    );
    eligible = [...eligible, ...extras];
  }

  return eligible.slice(0, LEADERBOARD_LIMIT);
}

function profileUsername(profile: { username?: string | null } | null | undefined) {
  return profile?.username ?? "foodie";
}

function toEntry(
  plate: {
    id: string;
    score: number | string;
    image_url?: string | null;
    dish_name?: string | null;
    is_active?: boolean | null;
    profiles?: { username?: string | null } | { username?: string | null }[] | null;
  },
  rank: number
): LeaderboardEntry | null {
  if (plate.is_active === false) return null;

  const profile = Array.isArray(plate.profiles) ? plate.profiles[0] : plate.profiles;

  return {
    plateId: plate.id,
    rank,
    score: Number(plate.score),
    imageUrl: plate.image_url ?? null,
    dishName: plate.dish_name ?? null,
    username: profileUsername(profile),
  };
}

export async function fetchCachedWeeklyLeaderboard(
  supabase: SupabaseClient,
  weekStart = getWeekStartDate()
) {
  const { data: weekly } = await supabase
    .from("leaderboard_weekly")
    .select("rank, score, plate_id, plates(id, image_url, dish_name, is_active), profiles(username)")
    .eq("week_start", weekStart)
    .order("rank", { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  const entries: LeaderboardEntry[] = [];

  for (const row of weekly ?? []) {
    const plate = Array.isArray(row.plates) ? row.plates[0] : row.plates;
    if (!plate?.id) continue;

    const entry = toEntry(
      {
        id: row.plate_id,
        score: row.score,
        image_url: plate.image_url,
        dish_name: plate.dish_name,
        is_active: plate.is_active,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      },
      row.rank
    );

    if (entry) entries.push(entry);
  }

  return entries;
}

export async function fetchLiveWeeklyLeaderboard(supabase: SupabaseClient) {
  const { data: plates } = await supabase
    .from("plates")
    .select("id, score, hot_count, not_count, image_url, dish_name, is_active, profiles(username)")
    .gte("created_at", getLookbackSince())
    .eq("is_active", true);

  const ranked = rankEligiblePlates(plates ?? []);
  const entries: LeaderboardEntry[] = [];

  ranked.forEach((plate, index) => {
    const entry = toEntry(plate, index + 1);
    if (entry) entries.push(entry);
  });

  return entries;
}

export async function fetchWeeklyLeaderboard(supabase: SupabaseClient) {
  const cached = await fetchCachedWeeklyLeaderboard(supabase);
  if (cached.length > 0) return cached;
  return fetchLiveWeeklyLeaderboard(supabase);
}

export async function refreshWeeklyLeaderboardCache(supabase: SupabaseClient) {
  const weekStart = getWeekStartDate();
  const { data: plates } = await supabase
    .from("plates")
    .select("id, user_id, score, hot_count, not_count")
    .gte("created_at", getLookbackSince())
    .eq("is_active", true);

  const top = rankEligiblePlates(plates ?? []);

  await supabase.from("leaderboard_weekly").delete().eq("week_start", weekStart);

  if (top.length > 0) {
    await supabase.from("leaderboard_weekly").insert(
      top.map((plate, index) => ({
        plate_id: plate.id,
        user_id: plate.user_id,
        week_start: weekStart,
        score: plate.score,
        hot_count: plate.hot_count,
        rank: index + 1,
      }))
    );
  }

  return top.length;
}

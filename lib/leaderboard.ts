import type { SupabaseClient } from "@supabase/supabase-js";
import { isVerifiedProfile } from "@/lib/profile-verified";

export const LEADERBOARD_LIMIT = 5;
export const LEADERBOARD_LOOKBACK_DAYS = 7;
export const LEADERBOARD_MONTH_LOOKBACK_DAYS = 30;
export const LEADERBOARD_MIN_VOTES = 3;
export const LEADERBOARD_FALLBACK_MIN_VOTES = 1;

export interface LeaderboardEntry {
  plateId: string;
  rank: number;
  score: number;
  imageUrl: string | null;
  restaurantName: string | null;
  dishName: string | null;
  username: string;
  displayName: string | null;
  verified: boolean;
}

export function getWeekStartDate(date = new Date()) {
  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  return weekStart.toISOString().slice(0, 10);
}

export function getLookbackSince(days = LEADERBOARD_LOOKBACK_DAYS, date = new Date()) {
  const since = new Date(date);
  since.setUTCDate(since.getUTCDate() - days);
  return since.toISOString();
}

export function voteCount(plate: { hot_count?: number | null; not_count?: number | null }) {
  return (plate.hot_count ?? 0) + (plate.not_count ?? 0);
}

const LEADERBOARD_PRIOR_SCORE = 5;
const LEADERBOARD_PRIOR_VOTES = 5;

/** Ranking score that balances plate score with vote volume. */
export function leaderboardRankScore(plate: {
  score: number | string;
  hot_count?: number | null;
  not_count?: number | null;
}) {
  const votes = voteCount(plate);
  if (votes === 0) return 0;

  const score = Number(plate.score);
  return (score * votes + LEADERBOARD_PRIOR_SCORE * LEADERBOARD_PRIOR_VOTES) / (votes + LEADERBOARD_PRIOR_VOTES);
}

export function comparePlatesByQuality<
  T extends { score: number | string; hot_count?: number | null; not_count?: number | null },
>(a: T, b: T) {
  const rankDiff = leaderboardRankScore(b) - leaderboardRankScore(a);
  if (rankDiff !== 0) return rankDiff;

  const voteDiff = voteCount(b) - voteCount(a);
  if (voteDiff !== 0) return voteDiff;

  return Number(b.score) - Number(a.score);
}

export function pickBestPlate<
  T extends { score: number | string; hot_count?: number | null; not_count?: number | null },
>(plates: T[]): T | null {
  if (!plates.length) return null;
  return [...plates].sort(comparePlatesByQuality)[0];
}

export function rankEligiblePlates<
  T extends { score: number | string; hot_count?: number | null; not_count?: number | null },
>(plates: T[]) {
  const sorted = [...plates].sort(comparePlatesByQuality);
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

function pickHottestFromPlates<
  T extends {
    id: string;
    score: number | string;
    hot_count?: number | null;
    not_count?: number | null;
    image_url?: string | null;
    restaurant_name?: string | null;
    dish_name?: string | null;
    is_active?: boolean | null;
    profiles?:
      | { username?: string | null; display_name?: string | null; total_plates?: number | null }
      | { username?: string | null; display_name?: string | null; total_plates?: number | null }[]
      | null;
  },
>(plates: T[]): T | null {
  const ranked = rankEligiblePlates(plates);
  if (ranked.length > 0) return ranked[0];

  const withVotes = plates.filter((plate) => voteCount(plate) >= LEADERBOARD_FALLBACK_MIN_VOTES);
  return pickBestPlate(withVotes.length ? withVotes : plates);
}

async function fetchPlatesInLookback(supabase: SupabaseClient, lookbackDays: number) {
  const { data: plates } = await supabase
    .from("plates")
    .select("id, score, hot_count, not_count, image_url, dish_name, restaurant_name, is_active, profiles(username, display_name, total_plates)")
    .gte("created_at", getLookbackSince(lookbackDays))
    .eq("is_active", true);

  return plates ?? [];
}

async function fetchAllActivePlates(supabase: SupabaseClient) {
  const { data: plates } = await supabase
    .from("plates")
    .select("id, score, hot_count, not_count, image_url, dish_name, restaurant_name, is_active, profiles(username, display_name, total_plates)")
    .eq("is_active", true);

  return plates ?? [];
}

export async function fetchHottestPlate(
  supabase: SupabaseClient,
  lookbackDays: number
): Promise<LeaderboardEntry | null> {
  const plates = await fetchPlatesInLookback(supabase, lookbackDays);
  const hottest = pickHottestFromPlates(plates);
  return hottest ? toEntry(hottest, 1) : null;
}

function profileUsername(profile: { username?: string | null; display_name?: string | null } | null | undefined) {
  return profile?.username ?? "foodie";
}

function profileDisplayName(profile: { username?: string | null; display_name?: string | null } | null | undefined) {
  return profile?.display_name?.trim() || null;
}

function toEntry(
  plate: {
    id: string;
    score: number | string;
    image_url?: string | null;
    restaurant_name?: string | null;
    dish_name?: string | null;
    is_active?: boolean | null;
    profiles?:
      | { username?: string | null; display_name?: string | null; total_plates?: number | null }
      | { username?: string | null; display_name?: string | null; total_plates?: number | null }[]
      | null;
  },
  rank: number
): LeaderboardEntry | null {
  if (plate.is_active === false) return null;

  const profile = Array.isArray(plate.profiles) ? plate.profiles[0] : plate.profiles;
  const username = profileUsername(profile);

  return {
    plateId: plate.id,
    rank,
    score: Number(plate.score),
    imageUrl: plate.image_url ?? null,
    restaurantName: plate.restaurant_name ?? null,
    dishName: plate.dish_name ?? null,
    username,
    displayName: profileDisplayName(profile),
    verified: isVerifiedProfile({ username, total_plates: profile?.total_plates }),
  };
}

export async function fetchCachedWeeklyLeaderboard(
  supabase: SupabaseClient,
  weekStart = getWeekStartDate()
) {
  const { data: weekly } = await supabase
    .from("leaderboard_weekly")
    .select("rank, score, plate_id, plates(id, image_url, dish_name, restaurant_name, is_active), profiles(username, display_name, total_plates)")
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
        restaurant_name: plate.restaurant_name,
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
  const plates = await fetchPlatesInLookback(supabase, LEADERBOARD_LOOKBACK_DAYS);
  const ranked = rankEligiblePlates(plates);
  const entries: LeaderboardEntry[] = [];

  ranked.forEach((plate, index) => {
    const entry = toEntry(plate, index + 1);
    if (entry) entries.push(entry);
  });

  return entries;
}

export async function fetchAllTimeLeaderboard(supabase: SupabaseClient) {
  const plates = await fetchAllActivePlates(supabase);
  const ranked = rankEligiblePlates(plates);
  const entries: LeaderboardEntry[] = [];

  ranked.forEach((plate, index) => {
    const entry = toEntry(plate, index + 1);
    if (entry) entries.push(entry);
  });

  return entries;
}

export async function fetchWeeklyLeaderboard(supabase: SupabaseClient) {
  const live = await fetchLiveWeeklyLeaderboard(supabase);
  if (live.length > 0) return live;
  return fetchCachedWeeklyLeaderboard(supabase);
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

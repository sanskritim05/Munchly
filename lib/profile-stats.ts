import { createAdminClient } from "@/lib/supabase/admin";

type RatedPlate = {
  score: number | string;
  hot_count: number;
  not_count: number;
};

export function computeProfileAverage(plates: RatedPlate[]) {
  const rated = plates.filter((plate) => plate.hot_count + plate.not_count > 0);
  if (rated.length === 0) return 0;

  return (
    Math.round(
      (rated.reduce((sum, plate) => sum + Number(plate.score), 0) / rated.length) * 100
    ) / 100
  );
}

export async function syncProfileAverageIfNeeded(
  userId: string,
  computedAverage: number,
  storedAverage: number
) {
  if (Math.abs(computedAverage - storedAverage) < 0.005) {
    return computedAverage;
  }

  const supabase = createAdminClient();
  await supabase.from("profiles").update({ average_score: computedAverage }).eq("id", userId);
  return computedAverage;
}

export async function recalculateUserAverage(userId: string) {
  const supabase = createAdminClient();

  const { data: plates } = await supabase
    .from("plates")
    .select("score, hot_count, not_count")
    .eq("user_id", userId)
    .eq("is_active", true);

  const average = computeProfileAverage(plates ?? []);
  await supabase.from("profiles").update({ average_score: average }).eq("id", userId);

  return average;
}

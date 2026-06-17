import { createAdminClient } from "@/lib/supabase/admin";

export async function recalculateUserAverage(userId: string) {
  const supabase = createAdminClient();

  const { data: plates } = await supabase
    .from("plates")
    .select("score, hot_count, not_count")
    .eq("user_id", userId)
    .eq("is_active", true);

  const rated = (plates ?? []).filter((p) => p.hot_count + p.not_count > 0);
  const average =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, p) => sum + Number(p.score), 0) / rated.length) * 100
        ) / 100
      : 0;

  await supabase.from("profiles").update({ average_score: average }).eq("id", userId);

  return average;
}

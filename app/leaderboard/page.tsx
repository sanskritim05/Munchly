import { AppIcon } from "@/components/AppIcon";
import { AnalyticsOnce } from "@/components/AnalyticsOnce";
import { LeaderboardPlateRow, LeaderboardSpotlight } from "@/components/LeaderboardSpotlight";
import {
  fetchHottestPlate,
  fetchWeeklyLeaderboard,
  LEADERBOARD_LOOKBACK_DAYS,
  LEADERBOARD_MONTH_LOOKBACK_DAYS,
} from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = createAdminClient();
  const [weekHottest, monthHottest, weekEntries] = await Promise.all([
    fetchHottestPlate(supabase, LEADERBOARD_LOOKBACK_DAYS),
    fetchHottestPlate(supabase, LEADERBOARD_MONTH_LOOKBACK_DAYS),
    fetchWeeklyLeaderboard(supabase),
  ]);

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <AnalyticsOnce eventName="leaderboard_viewed" />
      <h1 className="text-2xl font-bold sm:text-3xl">Top</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <LeaderboardSpotlight label="Week's hottest" entry={weekHottest} />
        <LeaderboardSpotlight label="Month's hottest" entry={monthHottest} />
      </div>

      <h2 className="mt-8 text-lg font-bold">This week&apos;s plates</h2>

      <ul className="mt-4 space-y-3">
        {weekEntries.length === 0 ? (
          <li className="rounded-2xl border border-border bg-surface p-6 text-center text-gray-400">
            <span className="inline-flex items-center justify-center gap-2">
              No entries yet. Post a plate and get rated. <AppIcon kind="flame" size={20} />
            </span>
          </li>
        ) : (
          weekEntries.map((entry) => (
            <li key={entry.plateId}>
              <LeaderboardPlateRow entry={entry} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

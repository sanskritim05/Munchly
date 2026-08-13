import { AppIcon } from "@/components/AppIcon";
import { AnalyticsOnce } from "@/components/AnalyticsOnce";
import { LeaderboardPlateRow } from "@/components/LeaderboardSpotlight";
import { fetchAllTimeLeaderboard } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = createAdminClient();
  const entries = await fetchAllTimeLeaderboard(supabase);

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <AnalyticsOnce eventName="leaderboard_viewed" />
      <h1 className="text-2xl font-bold sm:text-3xl">Top</h1>
      <p className="mt-1 text-sm text-gray-400">All-time highest rated plates</p>

      <ul className="mt-6 space-y-3">
        {entries.length === 0 ? (
          <li className="rounded-2xl border border-border bg-surface p-6 text-center text-gray-400">
            <span className="inline-flex items-center justify-center gap-2">
              No entries yet. Post a plate and get rated. <AppIcon kind="flame" size={20} />
            </span>
          </li>
        ) : (
          entries.map((entry) => (
            <li key={entry.plateId}>
              <LeaderboardPlateRow entry={entry} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

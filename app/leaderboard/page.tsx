import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { AnalyticsOnce } from "@/components/AnalyticsOnce";
import { ScoreBadge } from "@/components/ScoreBadge";
import { UserLabel } from "@/components/UserLabel";
import { fetchWeeklyLeaderboard } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = createAdminClient();
  const entries = await fetchWeeklyLeaderboard(supabase);

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <AnalyticsOnce eventName="leaderboard_viewed" />
      <h1 className="text-2xl font-bold sm:text-3xl">
        This Week&apos;s Hottest Plates
      </h1>
      <p className="mt-2 text-sm text-gray-500">
      </p>

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
              <Link
                href={`/plate/${entry.plateId}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-hot/50"
              >
                <span className="w-8 text-center text-xl font-bold text-hot">
                  #{entry.rank}
                </span>
                <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {entry.restaurantName ? (
                    <p className="truncate font-bold leading-snug">{entry.restaurantName}</p>
                  ) : null}
                  {entry.dishName ? (
                    <p
                      className={`truncate text-sm leading-snug text-gray-300 ${
                        entry.restaurantName ? "" : "font-bold text-white"
                      }`}
                    >
                      {entry.dishName}
                    </p>
                  ) : null}
                  {!entry.restaurantName && !entry.dishName ? (
                    <p className="font-bold">Plate</p>
                  ) : null}
                  <div className="mt-1">
                    <UserLabel
                      username={entry.username}
                      displayName={entry.displayName}
                      className="truncate text-sm"
                      nameClassName="font-medium text-gray-200"
                      handleClassName="text-gray-400"
                    />
                  </div>
                </div>
                <ScoreBadge score={entry.score} size="sm" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

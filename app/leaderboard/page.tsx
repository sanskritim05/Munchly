import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { AnalyticsOnce } from "@/components/AnalyticsOnce";
import { ScoreBadge } from "@/components/ScoreBadge";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface LeaderboardEntry {
  plateId: string;
  rank: number;
  score: number;
  imageUrl: string | null;
  dishName: string | null;
  username: string;
}

export default async function LeaderboardPage() {
  const supabase = createAdminClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const { data: weekly } = await supabase
    .from("leaderboard_weekly")
    .select("rank, score, plate_id, plates(image_url, dish_name, is_active), profiles(username)")
    .eq("week_start", weekStart.toISOString().slice(0, 10))
    .order("rank", { ascending: true })
    .limit(10);

  const entries: LeaderboardEntry[] = (weekly ?? [])
    .map((row) => {
      const plate = Array.isArray(row.plates) ? row.plates[0] : row.plates;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      if (!plate?.is_active) return null;

      return {
        plateId: row.plate_id,
        rank: row.rank,
        score: Number(row.score),
        imageUrl: plate.image_url ?? null,
        dishName: plate.dish_name ?? null,
        username: profile?.username ?? "foodie",
      };
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null);

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <AnalyticsOnce eventName="leaderboard_viewed" />
      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
        This Week&apos;s Hottest Plates <AppIcon kind="trophy" size={32} />
      </h1>

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
                <div className="flex-1">
                  <p className="font-bold">{entry.dishName ?? "Plate"}</p>
                  <p className="text-sm text-gray-400">@{entry.username}</p>
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

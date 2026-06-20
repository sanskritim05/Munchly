import Image from "next/image";
import Link from "next/link";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileStatsSection } from "@/components/ProfileStatsSection";
import { ProfilePlatesGrid } from "@/components/ProfilePlatesGrid";
import { ProfileSettingsButton } from "@/components/ProfileSettingsButton";
import { ProfileViewTracker } from "@/components/ProfileViewTracker";
import { ScoreBadge } from "@/components/ScoreBadge";
import { pickBestPlate, voteCount } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const avgScore = Number(profile.average_score);
  const totalPlates = profile.total_plates ?? 0;

  const { data: plates } = await supabase
    .from("plates")
    .select("id, image_url, score, dish_name, restaurant_name, hot_count, not_count")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const best = plates?.length ? pickBestPlate(plates) : null;
  const bestVotes = best ? voteCount(best) : 0;

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <ProfileViewTracker profileUserId={profile.id} />
      <ProfileSettingsButton profileUserId={profile.id} />

      <ProfileHeader
        displayName={profile.display_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        averageScore={avgScore}
        totalPlates={totalPlates}
      />

      <ProfileStatsSection
        profileUserId={profile.id}
        totalPlates={totalPlates}
        avgScore={avgScore}
        initialFollowerCount={profile.follower_count ?? 0}
      />

      {best ? (
        <Link
          href={`/plate/${best.id}`}
          className="mt-6 block rounded-2xl border border-hot/50 bg-surface p-4"
        >
          <p className="text-sm font-semibold text-hot">Best Plate</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl">
              <Image src={best.image_url} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-snug">
                {best.restaurant_name && best.dish_name ? (
                  <>
                    <span>{best.restaurant_name}</span>
                    <span className="text-gray-400"> · </span>
                    <span>{best.dish_name}</span>
                  </>
                ) : (
                  best.restaurant_name ?? best.dish_name ?? "Plate"
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ScoreBadge score={Number(best.score)} size="sm" />
                <span className="text-sm text-gray-400">
                  {bestVotes} vote{bestVotes === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : null}

      <ProfilePlatesGrid profileUserId={profile.id} plates={plates ?? []} />
    </div>
  );
}

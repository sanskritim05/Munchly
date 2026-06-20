"use client";

import { useState } from "react";
import { ProfileFollowButton } from "@/components/ProfileFollowButton";
import { ScoreBadge } from "@/components/ScoreBadge";

export function ProfileStatsSection({
  profileUserId,
  totalPlates,
  avgScore,
  initialFollowerCount,
}: {
  profileUserId: string;
  totalPlates: number;
  avgScore: number;
  initialFollowerCount: number;
}) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  return (
    <>
      <ProfileFollowButton
        profileUserId={profileUserId}
        onFollowerCountChange={setFollowerCount}
      />

      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3 text-center sm:gap-4 sm:p-4">
        <div>
          <p className="text-2xl font-bold">{totalPlates}</p>
          <p className="text-xs text-gray-400">Plates</p>
        </div>
        <div>
          <div className="flex justify-center">
            <ScoreBadge score={avgScore} size="sm" />
          </div>
          <p className="mt-1 text-xs text-gray-400">Avg Score</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{followerCount}</p>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
      </div>
    </>
  );
}

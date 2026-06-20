"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProfileFollowButton } from "@/components/ProfileFollowButton";
import { ScoreBadge } from "@/components/ScoreBadge";
import { useAuth } from "@/components/AuthProvider";
import { isRegisteredUser } from "@/lib/auth-user";

export function ProfileStatsSection({
  profileUserId,
  username,
  totalPlates,
  avgScore,
  initialFollowerCount,
}: {
  profileUserId: string;
  username: string;
  totalPlates: number;
  avgScore: number;
  initialFollowerCount: number;
}) {
  const { user, getAccessToken } = useAuth();
  const isOwner = isRegisteredUser(user) && user.id === profileUserId;
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  useEffect(() => {
    setFollowerCount(initialFollowerCount);
  }, [initialFollowerCount]);

  const loadFollowingCount = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    const res = await fetch("/api/follow/following", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setFollowingCount(data.count ?? 0);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isOwner) return;
    void loadFollowingCount();
  }, [isOwner, loadFollowingCount]);

  return (
    <>
      <ProfileFollowButton
        profileUserId={profileUserId}
        username={username}
        onFollowingChange={loadFollowingCount}
        onFollowerCountChange={setFollowerCount}
      />

      <div
        className={`mt-6 grid gap-2 rounded-2xl border border-border bg-surface p-3 text-center sm:gap-4 sm:p-4 ${
          isOwner ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
        }`}
      >
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
        {isOwner ? (
          <Link
            href="/profile/following"
            className="transition-colors hover:text-hot"
          >
            <p className="text-2xl font-bold">{followingCount ?? "—"}</p>
            <p className="text-xs text-gray-400">Following</p>
          </Link>
        ) : null}
        <div>
          <p className="text-2xl font-bold">{followerCount}</p>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
      </div>
    </>
  );
}

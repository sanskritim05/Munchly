"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { UserLabel } from "@/components/UserLabel";
import { useAuth } from "@/components/AuthProvider";
import { isOfficialAccountUsername } from "@/lib/profile-verified";

interface FollowingProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified?: boolean;
}

export function ProfileFollowingList() {
  const { getAccessToken } = useAuth();
  const [following, setFollowing] = useState<FollowingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const loadFollowing = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setError("");
    const res = await fetch("/api/follow/following", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not load following");
      setLoading(false);
      return;
    }

    setFollowing(data.following ?? []);
    setLoading(false);
  }, [getAccessToken]);

  useEffect(() => {
    void loadFollowing();
  }, [loadFollowing]);

  async function unfollow(userId: string, username: string) {
    if (isOfficialAccountUsername(username)) return;

    const token = getAccessToken();
    if (!token || unfollowingId) return;

    setUnfollowingId(userId);
    try {
      const res = await fetch(`/api/follow?user_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFollowing((current) => current.filter((profile) => profile.id !== userId));
      }
    } finally {
      setUnfollowingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!following.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-gray-300">You&apos;re not following anyone yet.</p>
        <Link
          href="/leaderboard"
          className="mt-4 inline-block text-sm font-bold text-hot hover:underline"
        >
          Find people on Top →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {following.map((profile) => {
        const isOfficial = isOfficialAccountUsername(profile.username);

        return (
          <li
            key={profile.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
          >
            <Link href={`/profile/${profile.username}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-black/20">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <AppIcon kind="profile" size={40} />
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${profile.username}`} className="block truncate hover:text-hot">
                <UserLabel
                  username={profile.username}
                  displayName={profile.display_name}
                  verified={profile.verified}
                  nameClassName="font-semibold"
                  handleClassName="text-gray-400"
                />
              </Link>
            </div>
            {isOfficial ? null : (
              <button
                type="button"
                onClick={() => void unfollow(profile.id, profile.username)}
                disabled={unfollowingId === profile.id}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
              >
                {unfollowingId === profile.id ? "..." : "Unfollow"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { UserLabel } from "@/components/UserLabel";
import { useAuth } from "@/components/AuthProvider";

interface FollowerProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified?: boolean;
}

export function ProfileFollowersList() {
  const { getAccessToken } = useAuth();
  const [followers, setFollowers] = useState<FollowerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFollowers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setError("");
    const res = await fetch("/api/follow/followers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not load followers");
      setLoading(false);
      return;
    }

    setFollowers(data.followers ?? []);
    setLoading(false);
  }, [getAccessToken]);

  useEffect(() => {
    void loadFollowers();
  }, [loadFollowers]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!followers.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-gray-300">No followers yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {followers.map((profile) => (
        <li
          key={profile.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
        >
          <Link
            href={`/profile/${profile.username}`}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-black/20"
          >
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
        </li>
      ))}
    </ul>
  );
}

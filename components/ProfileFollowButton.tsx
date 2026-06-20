"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isRegisteredUser } from "@/lib/auth-user";

export function ProfileFollowButton({
  profileUserId,
  onFollowerCountChange,
}: {
  profileUserId: string;
  onFollowerCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = user?.id === profileUserId;

  useEffect(() => {
    async function loadStatus() {
      if (!user || isOwnProfile) {
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/follow?user_id=${profileUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFollowing(Boolean(data.following));
        if (typeof data.follower_count === "number") {
          onFollowerCountChange?.(data.follower_count);
        }
      }

      setLoading(false);
    }

    loadStatus();
  }, [user, isOwnProfile, profileUserId, getAccessToken, onFollowerCountChange]);

  async function toggleFollow() {
    const token = getAccessToken();
    if (!token || saving) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/follow?user_id=${profileUserId}`,
        following
          ? { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          : {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ user_id: profileUserId }),
            }
      );

      if (res.ok) {
        const data = await res.json();
        setFollowing(Boolean(data.following));
        if (typeof data.follower_count === "number") {
          onFollowerCountChange?.(data.follower_count);
        }
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isRegisteredUser(user) || isOwnProfile || loading) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={saving}
      className={`mt-4 w-full rounded-full py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
        following
          ? "border border-border bg-surface text-gray-300"
          : "bg-hot text-white"
      }`}
    >
      {saving ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}

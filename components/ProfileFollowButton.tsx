"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isRegisteredUser } from "@/lib/auth-user";
import { isOfficialAccountUsername } from "@/lib/profile-verified";

export function ProfileFollowButton({
  profileUserId,
  username,
  onFollowingChange,
  onFollowerCountChange,
}: {
  profileUserId: string;
  username: string;
  onFollowingChange?: () => void;
  onFollowerCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = user?.id === profileUserId;
  const isOfficialAccount = isOfficialAccountUsername(username);

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
  }, [user, isOwnProfile, profileUserId, getAccessToken]);

  async function toggleFollow() {
    const token = getAccessToken();
    if (!token || saving || (isOfficialAccount && following)) return;

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
        onFollowingChange?.();
        if (typeof data.follower_count === "number") {
          onFollowerCountChange?.(data.follower_count);
        }
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isRegisteredUser(user) || isOwnProfile || loading || (isOfficialAccount && following)) {
    return null;
  }

  return (
    <div className="absolute right-4 top-6 z-10">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={saving}
        className={`inline-flex shrink-0 items-center rounded-full border bg-surface px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          following
            ? "border-border text-gray-300 hover:border-hot/40 hover:text-hot"
            : "border-hot/40 text-hot hover:bg-hot/10"
        }`}
      >
        {saving ? "..." : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

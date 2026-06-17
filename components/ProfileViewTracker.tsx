"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/analytics";

export function ProfileViewTracker({
  profileUserId,
}: {
  profileUserId: string;
}) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    void track("profile_viewed", {
      is_own_profile: user?.id === profileUserId,
      profile_user_id: profileUserId,
    });
  }, [profileUserId, user?.id]);

  return null;
}

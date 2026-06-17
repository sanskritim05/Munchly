"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  getLocalRatingsCount,
  hasPostingAccess,
  RATING_GATE_REQUIRED,
  setLocalRatingsCount,
} from "@/lib/onboarding-ratings";
import { createBrowserClient } from "@/lib/supabase/client";

export function PostGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [ratingsCount, setRatingsCount] = useState(0);

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return;

      if (!user) {
        setChecking(false);
        return;
      }

      const localCount = getLocalRatingsCount();
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_ratings_count")
        .eq("id", user.id)
        .maybeSingle();

      const profileCount = data?.onboarding_ratings_count ?? 0;
      const syncedCount = Math.max(localCount, profileCount);
      setLocalRatingsCount(syncedCount);
      setRatingsCount(syncedCount);
      setUnlocked(hasPostingAccess(localCount, profileCount));
      setChecking(false);
    }

    void checkAccess();
  }, [authLoading, user]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!unlocked) {
    const progress = Math.min(ratingsCount / RATING_GATE_REQUIRED, 1);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-6 text-center">
        <h1 className="font-syne text-[28px] font-extrabold text-[#f0ede6]">
          earn your posting rights
        </h1>
        <p className="mt-3 max-w-xs text-sm text-[#666]">
          rate 3 plates first, then you can post your own
        </p>

        <div className="mt-8 w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className="h-full rounded-full bg-[#ff3c00] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#666]">
            {ratingsCount}/{RATING_GATE_REQUIRED} ratings completed
          </p>
        </div>

        <Link
          href="/swipe"
          className="mt-8 inline-flex rounded-full bg-[#ff3c00] px-8 py-4 font-syne text-base font-bold text-white"
        >
          start rating →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

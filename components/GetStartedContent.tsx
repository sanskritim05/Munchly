"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { useAuth } from "@/components/AuthProvider";
import { resolveAuthNext } from "@/lib/auth-redirect";
import { createBrowserClient } from "@/lib/supabase/client";
import type { LandingCarouselPlate } from "@/lib/landing-carousel";

export function GetStartedContent({ plates }: { plates: LandingCarouselPlate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  const next = resolveAuthNext(searchParams.get("next"));

  useEffect(() => {
    async function init() {
      if (loading) return;

      if (!user) {
        setChecking(false);
        return;
      }

      if (user.is_anonymous) {
        setChecking(false);
        return;
      }

      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          setChecking(false);
          return;
        }

        if (data?.onboarding_complete) {
          router.replace(next);
          return;
        }

        setChecking(false);
      } catch {
        setChecking(false);
      }
    }

    init();
  }, [user, loading, router, next]);

  if (loading || checking) {
    return (
      <div className="flex min-h-app items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return <ProfileSetupForm plates={plates} />;
}

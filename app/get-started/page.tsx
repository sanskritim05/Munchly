"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

function GetStartedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  const next = searchParams.get("next") || "/swipe";

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return <ProfileSetupForm />;
}

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <GetStartedContent />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    async function check() {
      if (loading) return;
      if (!user) {
        router.replace("/get-started");
        return;
      }

      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!data?.onboarding_complete) {
        router.replace("/get-started");
      }
    }
    check();
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-app items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

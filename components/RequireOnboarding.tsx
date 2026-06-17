"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    async function check() {
      if (loading) return;
      if (!user) {
        router.replace(`/get-started?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!data?.onboarding_complete) {
        router.replace(`/get-started?next=${encodeURIComponent(pathname)}`);
      }
    }
    check();
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

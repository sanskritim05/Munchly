"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ProfileMePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function redirect() {
      if (loading) return;
      if (!user) {
        router.replace("/get-started?next=/profile/me");
        return;
      }

      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("username, onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data?.username) {
        setFailed(true);
        return;
      }

      if (!data.onboarding_complete) {
        router.replace("/get-started?next=/profile/me");
        return;
      }

      router.replace(`/profile/${data.username}`);
    }
    redirect();
  }, [user, loading, router]);

  if (failed) {
    return (
      <div className="flex min-h-app flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-400">Could not load your profile.</p>
        <Link href="/swipe" className="text-hot">
          Back to rating
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-app items-center justify-center">
      <p className="text-gray-400">Loading profile...</p>
    </div>
  );
}

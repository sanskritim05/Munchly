"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<{
    display_name: string | null;
    username: string;
    bio: string | null;
    avatar_url: string | null;
    username_changed_at: string | null;
    display_name_changed_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (authLoading) return;
      if (!user) {
        router.replace("/signin?next=/swipe");
        return;
      }

      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "display_name, username, bio, avatar_url, onboarding_complete, username_changed_at, display_name_changed_at"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      if (!data.onboarding_complete) {
        router.replace("/get-started?next=/swipe");
        return;
      }

      setProfile({
        display_name: data.display_name,
        username: data.username,
        bio: data.bio,
        avatar_url: data.avatar_url,
        username_changed_at: data.username_changed_at,
        display_name_changed_at: data.display_name_changed_at,
      });
      setLoading(false);
    }

    load();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-app items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-app flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-400">Could not load settings.</p>
        <Link href="/swipe" className="text-hot">
          Back to rating
        </Link>
      </div>
    );
  }

  return <ProfileSettingsForm initial={profile} />;
}

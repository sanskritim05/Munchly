"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileFollowersList } from "@/components/ProfileFollowersList";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import { isRegisteredUser } from "@/lib/auth-user";
import { isOfficialAccountUsername } from "@/lib/profile-verified";

export default function ProfileFollowersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (loading) return;

      if (!isRegisteredUser(user)) {
        router.replace("/get-started?next=/profile/followers");
        return;
      }

      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (!data?.username || !isOfficialAccountUsername(data.username)) {
        router.replace(data?.username ? `/profile/${data.username}` : "/profile/me");
        return;
      }

      setUsername(data.username);
    }

    void loadProfile();
  }, [user, loading, router]);

  if (loading || (isRegisteredUser(user) && !username)) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/profile/${username}`}
          className="text-sm text-gray-400 hover:text-hot"
        >
          Back
        </Link>
        <h1 className="text-2xl font-bold">Followers</h1>
      </div>
      <ProfileFollowersList />
    </div>
  );
}

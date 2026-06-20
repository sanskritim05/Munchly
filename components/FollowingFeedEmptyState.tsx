"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";
import { profileUrl } from "@/lib/app-url";
import { isRegisteredUser } from "@/lib/auth-user";
import { createBrowserClient } from "@/lib/supabase/client";

export function FollowingFeedEmptyState({
  followingCount,
}: {
  followingCount: number;
}) {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const followsNobody = followingCount === 0;

  useEffect(() => {
    if (!isRegisteredUser(user)) return;

    const supabase = createBrowserClient();
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user?.id]);

  async function inviteFriends() {
    if (!username) return;

    const url = profileUrl(username);
    const text = `follow me on Munchly: ${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // user cancelled or share failed - fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (followsNobody) {
    return (
      <FeedViewportEmpty
        title="follow people to see their plates here"
        description="find people on Top or invite friends to follow you"
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/leaderboard"
            className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
          >
            view top plates →
          </Link>
          {username ? (
            <button
              type="button"
              onClick={() => void inviteFriends()}
              className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold"
            >
              {copied ? "link copied!" : "invite them"}
            </button>
          ) : (
            <span className="text-sm text-gray-400">Loading invite link...</span>
          )}
        </div>
      </FeedViewportEmpty>
    );
  }

  const shareUrl = username ? profileUrl(username) : null;

  return (
    <FeedViewportEmpty title="nobody you follow has posted yet">
      {shareUrl ? (
        <button
          type="button"
          onClick={() => void inviteFriends()}
          disabled={!username}
          className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold disabled:opacity-50"
        >
          {copied ? "link copied!" : "invite them"}
        </button>
      ) : (
        <p className="text-sm text-gray-400">Loading your invite link...</p>
      )}
    </FeedViewportEmpty>
  );
}

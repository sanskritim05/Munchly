"use client";

import Link from "next/link";
import { useState } from "react";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";

export function FollowingFeedEmptyState({
  followingCount,
}: {
  followingCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const followsNobody = followingCount === 0;

  async function inviteFriends() {
    const url = window.location.origin;
    const text = `post your food on PlateCheck: ${url}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // user cancelled or share failed - fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (followsNobody) {
    return (
      <FeedViewportEmpty>
        <p className="text-xl font-bold">follow people to see their plates here</p>
        <p className="text-sm text-gray-500">find people on the leaderboard</p>
        <Link
          href="/leaderboard"
          className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
        >
          view top plates →
        </Link>
      </FeedViewportEmpty>
    );
  }

  return (
    <FeedViewportEmpty>
      <p className="text-xl font-bold">nobody you follow has posted yet</p>
      <button
        type="button"
        onClick={() => void inviteFriends()}
        className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
      >
        {copied ? "link copied!" : "invite them"}
      </button>
    </FeedViewportEmpty>
  );
}

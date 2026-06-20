"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppIcon } from "@/components/AppIcon";
import { FeedPlateOverlay } from "@/components/FeedPlateOverlay";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";
import { FollowingFeedEmptyState } from "@/components/FollowingFeedEmptyState";
import { PlateView } from "@/components/PlateView";
import { isRegisteredUser } from "@/lib/auth-user";
import type { FeedFilter } from "@/lib/feed-scope";
import { feedLoadingClass, feedMetaClass } from "@/lib/feed-ui";

interface BrowsePlate {
  id: string;
  image_url: string;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  hot_count: number;
  not_count: number;
  comment_count: number;
  username: string;
  display_name?: string | null;
  is_following?: boolean;
  is_verified?: boolean;
}

export function BrowseFeed({
  filter = "everyone",
  onFollowingCountChange,
}: {
  filter?: FeedFilter;
  onFollowingCountChange?: (count: number) => void;
}) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const [plates, setPlates] = useState<BrowsePlate[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const registered = isRegisteredUser(user);

  const loadBrowse = useCallback(async () => {
    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`/api/feed/browse?filter=${filter}`, { headers });
    const data = await res.json();
    setPlates(data.plates ?? []);
    const count = data.following_count ?? 0;
    setFollowingCount(count);
    onFollowingCountChange?.(count);
    setLoading(false);
    setRefreshing(false);
    return res.ok;
  }, [filter, getAccessToken, onFollowingCountChange]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void loadBrowse();
  }, [authLoading, loadBrowse, filter]);

  if (selectedId) {
    return (
      <PlateView
        plateId={selectedId}
        onBack={() => setSelectedId(null)}
        backLabel="Back to explore"
      />
    );
  }

  const browseMeta =
    registered && !loading && plates.length > 0 ? (
      <div className="mb-4 flex items-end justify-between gap-3 px-page">
        <p className={`${feedMetaClass}`}>
          {plates.length} post{plates.length === 1 ? "" : "s"}
          {filter === "following" ? " from people you follow" : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void loadBrowse();
          }}
          disabled={refreshing}
          className={`${feedMetaClass} shrink-0 font-medium text-hot disabled:opacity-50`}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center px-page">
          <p className={feedLoadingClass}>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (plates.length === 0) {
    if (filter === "following" && registered) {
      return (
        <div className="flex h-full flex-col">
          <FollowingFeedEmptyState followingCount={followingCount} />
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <FeedViewportEmpty
          title="no posts yet"
          description="When others post plates, you can explore them here."
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                void loadBrowse();
              }}
              disabled={refreshing}
              className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            {registered ? (
              <Link
                href="/post"
                className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
              >
                Post your plate
              </Link>
            ) : (
              <Link
                href="/get-started?next=/post"
                className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
              >
                Get started
              </Link>
            )}
          </div>
        </FeedViewportEmpty>
      </div>
    );
  }

  return (
    <div className="app-container w-full pb-6">
      {!registered ? (
        <p className="mb-4 rounded-xl border border-border bg-black/30 px-3 py-2 text-xs text-gray-400 mx-page mt-2">
          Exploring only.{" "}
          <Link href="/get-started?next=/swipe" className="font-semibold text-hot hover:underline">
            Create an account
          </Link>{" "}
          to rate, comment, and post.
        </p>
      ) : null}

      {browseMeta}

      <ul className="space-y-4 px-page">
        {plates.map((plate) => {
          const total = plate.hot_count + plate.not_count;
          const hotPct = total > 0 ? (plate.hot_count / total) * 100 : 50;

          return (
            <li key={plate.id}>
              <button
                type="button"
                onClick={() => setSelectedId(plate.id)}
                className="w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition-colors hover:border-hot/40"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={plate.image_url}
                    alt={plate.dish_name ?? "Plate"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <FeedPlateOverlay
                    score={plate.score}
                    username={plate.username}
                    displayName={plate.display_name}
                    verified={plate.is_verified}
                    title={plate.dish_name ?? "Plate"}
                    subtitle={plate.restaurant_name}
                    isFollowing={filter !== "following" && plate.is_following}
                    className="bottom-0 p-5"
                  />
                </div>

                <div className="p-4">
                  <div className="h-2 overflow-hidden rounded-full bg-black/40">
                    <div className="flex h-full">
                      <div className="bg-hot" style={{ width: `${hotPct}%` }} />
                      <div className="bg-gray-700" style={{ width: `${100 - hotPct}%` }} />
                    </div>
                  </div>
                  <div className={`mt-2 flex items-center justify-between ${feedMetaClass}`}>
                    <span className="inline-flex items-center gap-1">
                      <AppIcon kind="flame" size={14} />
                      {plate.hot_count} hot
                      <span className="mx-1">·</span>
                      <AppIcon kind="not" size={14} />
                      {plate.not_count} not
                    </span>
                    <span>
                      {plate.comment_count} comment{plate.comment_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-hot">View details →</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

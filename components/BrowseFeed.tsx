"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppIcon } from "@/components/AppIcon";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";
import { PlateView } from "@/components/PlateView";
import { ScoreBadge } from "@/components/ScoreBadge";
import { createBrowserClient } from "@/lib/supabase/client";

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
}

export function BrowseFeed() {
  const { getAccessToken, signInGuest, loading: authLoading } = useAuth();
  const [plates, setPlates] = useState<BrowsePlate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadBrowse = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? getAccessToken();
    if (!token) return false;

    const res = await fetch("/api/feed/browse", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPlates(data.plates ?? []);
    setLoading(false);
    setRefreshing(false);
    return true;
  }, [getAccessToken]);

  useEffect(() => {
    async function init() {
      if (authLoading) return;

      let token = getAccessToken();
      if (!token) {
        const result = await signInGuest();
        if (result.error) {
          setLoading(false);
          return;
        }
        const { data } = await createBrowserClient().auth.getSession();
        token = data.session?.access_token ?? null;
        if (!token) {
          setLoading(false);
          return;
        }
      }

      await loadBrowse(token);
    }
    init();
  }, [authLoading, getAccessToken, signInGuest, loadBrowse]);

  if (selectedId) {
    return (
      <PlateView
        plateId={selectedId}
        onBack={() => setSelectedId(null)}
        backLabel="Back to browse"
      />
    );
  }

  if (loading) {
    return (
      <FeedViewportEmpty>
        <p className="text-gray-400">Loading posts...</p>
      </FeedViewportEmpty>
    );
  }

  if (plates.length === 0) {
    return (
      <FeedViewportEmpty>
        <p className="text-xl font-bold">No posts yet</p>
        <p className="max-w-sm text-gray-400">
          When others post plates, you can browse them here and leave comments.
        </p>
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
          <Link
            href="/post"
            className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
          >
            Post your plate
          </Link>
        </div>
      </FeedViewportEmpty>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-2">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">{plates.length} posts</p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void loadBrowse();
          }}
          disabled={refreshing}
          className="text-sm font-medium text-hot disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <ul className="space-y-4">
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
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="mb-1 flex items-center gap-2">
                      <ScoreBadge score={plate.score} size="sm" />
                      <span className="text-sm text-gray-200">@{plate.username}</span>
                    </div>
                    <h3 className="text-lg font-bold">{plate.dish_name ?? "Plate"}</h3>
                    {plate.restaurant_name ? (
                      <p className="text-sm text-gray-300">{plate.restaurant_name}</p>
                    ) : null}
                  </div>
                </div>

                <div className="p-4">
                  <div className="h-2 overflow-hidden rounded-full bg-black/40">
                    <div className="flex h-full">
                      <div className="bg-hot" style={{ width: `${hotPct}%` }} />
                      <div className="bg-gray-700" style={{ width: `${100 - hotPct}%` }} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
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
                  <p className="mt-2 text-sm font-medium text-hot">View details & comment →</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import {
  animate,
  motion,
  MotionStyle,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppIcon } from "@/components/AppIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getStreak, recordRating } from "@/lib/streak";
import { track } from "@/lib/analytics";
import { FEED_VIEWPORT_HEIGHT } from "@/lib/feed-scope";
import { createBrowserClient } from "@/lib/supabase/client";
import { FollowingFeedEmptyState } from "@/components/FollowingFeedEmptyState";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";

interface FeedPlate {
  id: string;
  image_url: string;
  caption: string | null;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  username: string;
}

const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY = 450;
const BUTTON_SIZE = "h-[4.25rem] w-[4.25rem]";
const ICON_SIZE = 44;

function SwipeCard({
  plate,
  motionStyle,
  onDragEnd,
  hotOpacity,
  notOpacity,
  interactive = false,
}: {
  plate: FeedPlate;
  motionStyle?: MotionStyle;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  hotOpacity?: ReturnType<typeof useTransform<number, number>>;
  notOpacity?: ReturnType<typeof useTransform<number, number>>;
  interactive?: boolean;
}) {
  return (
    <motion.div
      drag={interactive ? "x" : false}
      dragConstraints={interactive ? { left: 0, right: 0 } : undefined}
      dragElastic={interactive ? 0.85 : undefined}
      onDragEnd={interactive ? onDragEnd : undefined}
      style={motionStyle}
      className="absolute inset-0 bottom-20 overflow-hidden rounded-2xl bg-surface shadow-2xl will-change-transform"
    >
      <Image
        src={plate.image_url}
        alt={plate.dish_name ?? "Plate"}
        fill
        className="object-cover select-none"
        priority={interactive}
        draggable={false}
        unoptimized
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

      {interactive && hotOpacity && notOpacity ? (
        <>
          <motion.div
            style={{ opacity: hotOpacity }}
            className="pointer-events-none absolute left-5 top-8 rotate-[-12deg] rounded-lg border-4 border-hot px-4 py-2 text-3xl font-black tracking-wider text-hot"
          >
            HOT
          </motion.div>
          <motion.div
            style={{ opacity: notOpacity }}
            className="pointer-events-none absolute right-5 top-8 rotate-[12deg] rounded-lg border-4 border-gray-300 px-4 py-2 text-3xl font-black tracking-wider text-gray-200"
          >
            NOT
          </motion.div>
        </>
      ) : null}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5">
        <div className="mb-2 flex items-center gap-2">
          <ScoreBadge score={plate.score} size="sm" />
          <span className="text-sm text-gray-300">@{plate.username}</span>
        </div>
        <h2 className="text-2xl font-bold">{plate.dish_name ?? "Plate"}</h2>
        {plate.restaurant_name ? (
          <p className="mt-1 text-sm text-gray-400">{plate.restaurant_name}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function RateFeed({ scope = "foryou" }: { scope?: "foryou" | "following" }) {
  const { getAccessToken, signInGuest, loading: authLoading } = useAuth();
  const [plates, setPlates] = useState<FeedPlate[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingHasPosts, setFollowingHasPosts] = useState(false);
  const [index, setIndex] = useState(0);
  const [ratedToday, setRatedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const hotOpacity = useTransform(x, [0, 60, 120], [0, 0.6, 1]);
  const notOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);

  const loadFeed = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? getAccessToken();
    if (!token) return false;

    const res = await fetch(`/api/feed?scope=${scope}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPlates(data.plates ?? []);
    setFollowingCount(data.following_count ?? 0);
    setFollowingHasPosts(Boolean(data.following_has_posts));
    setIndex(0);
    setLoading(false);
    setRefreshing(false);
    return true;
  }, [getAccessToken, scope]);

  useEffect(() => {
    async function init() {
      if (authLoading) return;

      let token = getAccessToken();

      if (!token) {
        const result = await signInGuest();
        if (result.error) {
          setAuthError(result.error);
          setLoading(false);
          return;
        }

        const { data } = await createBrowserClient().auth.getSession();
        token = data.session?.access_token ?? null;
        if (!token) {
          setAuthError("Could not start a guest session. Try again.");
          setLoading(false);
          return;
        }
      }

      const s = getStreak();
      setStreak(s.count);
      setRatedToday(s.ratedToday);
      await loadFeed(token);
    }
    init();
  }, [authLoading, getAccessToken, signInGuest, loadFeed, scope]);

  const current = plates[index];
  const next = plates[index + 1];

  async function submitRating(plateId: string, rating: 0 | 1) {
    const token = getAccessToken();
    if (!token) return;

    await fetch("/api/rate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plate_id: plateId, rating }),
    });

    const previousStreak = getStreak().count;
    const s = recordRating();
    setStreak(s.count);
    setRatedToday(s.ratedToday);

    void track("swipe_completed", {
      direction: rating === 1 ? "hot" : "not",
      plate_id: plateId,
    });

    if (s.count > previousStreak) {
      void track("streak_continued", { streak: s.count });
    }
  }

  async function flyOff(rating: 0 | 1) {
    if (!current || isLeaving) return;

    setIsLeaving(true);
    const destination = rating === 1 ? 520 : -520;

    await animate(x, destination, {
      type: "spring",
      stiffness: 280,
      damping: 28,
      mass: 0.8,
    });

    void submitRating(current.id, rating);
    setIndex((i) => i + 1);
    x.set(0);
    setIsLeaving(false);
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (isLeaving) return;

    const passedRight =
      info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY;
    const passedLeft =
      info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY;

    if (passedRight) {
      void flyOff(1);
      return;
    }

    if (passedLeft) {
      void flyOff(0);
      return;
    }

    animate(x, 0, { type: "spring", stiffness: 520, damping: 36 });
  }

  async function refreshFeed() {
    setRefreshing(true);
    await loadFeed();
  }

  if (authError) {
    return (
      <FeedViewportEmpty>
        <p className="text-lg text-hot">Could not connect</p>
        <p className="text-sm text-gray-400">{authError}</p>
        <button
          type="button"
          onClick={() => {
            setAuthError("");
            setLoading(true);
            signInGuest().then(async (result) => {
              if (result.error) {
                setAuthError(result.error);
                setLoading(false);
                return;
              }
              const { data } = await createBrowserClient().auth.getSession();
              const token = data.session?.access_token;
              if (token) await loadFeed(token);
              else {
                setAuthError("Could not start a guest session. Try again.");
                setLoading(false);
              }
            });
          }}
          className="rounded-full bg-hot px-6 py-3 font-bold"
        >
          Try again
        </button>
      </FeedViewportEmpty>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center px-4"
        style={{ height: FEED_VIEWPORT_HEIGHT }}
      >
        <p className="text-gray-400">Loading plates to rate...</p>
      </div>
    );
  }

  if (!current) {
    const caughtUp = plates.length > 0;

    if (scope === "following" && !caughtUp) {
      if (followingCount === 0 || !followingHasPosts) {
        return <FollowingFeedEmptyState followingCount={followingCount} />;
      }
    }

    return (
      <FeedViewportEmpty>
        <p className="text-2xl font-bold">
          {caughtUp ? "You've seen everything" : "Nothing to rate yet"}
        </p>
        <p className="max-w-sm text-gray-400">
          {caughtUp
            ? "Switch to Browse to see all posts and leave comments."
            : "Plates from other people will show up here. Post yours and invite friends to join."}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={refreshFeed}
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
    <div
      className="relative mx-auto max-w-lg px-1"
      style={{ height: FEED_VIEWPORT_HEIGHT, maxHeight: FEED_VIEWPORT_HEIGHT }}
    >
      <div className="absolute right-4 top-1 z-20 rounded-full bg-black/60 px-3 py-1 text-sm">
        <span className="inline-flex items-center gap-1">
          <AppIcon kind="flame" size={16} />
          {ratedToday} rated today
        </span>
        {streak > 0 ? ` · Day ${streak} streak` : ""}
      </div>

      <div className="absolute inset-0 pt-8">
        {next ? (
          <SwipeCard
            plate={next}
            motionStyle={{
              scale: 0.96,
              y: 8,
              opacity: 0.92,
              zIndex: 0,
            }}
          />
        ) : null}

        <SwipeCard
          plate={current}
          interactive
          hotOpacity={hotOpacity}
          notOpacity={notOpacity}
          onDragEnd={onDragEnd}
          motionStyle={{ x, rotate, zIndex: 10, touchAction: "none" }}
        />
      </div>

      <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-8 px-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          disabled={isLeaving}
          onClick={() => flyOff(0)}
          className={`${BUTTON_SIZE} flex items-center justify-center rounded-full border border-border bg-surface disabled:opacity-50`}
          aria-label="Not"
        >
          <AppIcon kind="not" size={ICON_SIZE} />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          disabled={isLeaving}
          onClick={() => flyOff(1)}
          className={`${BUTTON_SIZE} flex items-center justify-center rounded-full border border-hot/50 bg-surface shadow-lg shadow-hot/20 disabled:opacity-50`}
          aria-label="Hot"
        >
          <AppIcon kind="flame" size={ICON_SIZE} />
        </motion.button>
      </div>
    </div>
  );
}

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
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppIcon } from "@/components/AppIcon";
import { FeedPlateOverlay } from "@/components/FeedPlateOverlay";
import { getStreak, recordRating, syncRatedToday } from "@/lib/streak";
import { getUserTimezone } from "@/lib/local-day";
import { track } from "@/lib/analytics";
import { feedLoadingClass, feedCardShellClass, feedRateCardMediaClass } from "@/lib/feed-ui";
import { FeedSignInPrompt } from "@/components/FeedSignInPrompt";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";
import { FollowingFeedEmptyState } from "@/components/FollowingFeedEmptyState";
import { isRegisteredUser } from "@/lib/auth-user";
import type { FeedFilter } from "@/lib/feed-scope";

interface FeedPlate {
  id: string;
  image_url: string;
  caption: string | null;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  username: string;
  display_name?: string | null;
  is_following?: boolean;
  is_verified?: boolean;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY = 400;
const EXIT_X = 640;
const BUTTON_SIZE = "h-[3.75rem] w-[3.75rem] sm:h-[4.25rem] sm:w-[4.25rem]";
const ICON_SIZE = 40;

const EXIT_EASE = [0.32, 0.72, 0, 1] as const;
const SNAP_BACK_SPRING = { type: "spring" as const, stiffness: 460, damping: 32, mass: 0.7 };

function SwipeCard({
  plate,
  motionStyle,
  onDragEnd,
  hotOpacity,
  notOpacity,
  interactive = false,
  showFollowingBadge = true,
}: {
  plate: FeedPlate;
  motionStyle?: MotionStyle;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  hotOpacity?: ReturnType<typeof useTransform<number, number>>;
  notOpacity?: ReturnType<typeof useTransform<number, number>>;
  interactive?: boolean;
  showFollowingBadge?: boolean;
}) {
  return (
    <motion.div
      drag={interactive ? "x" : false}
      dragMomentum={false}
      dragElastic={0.15}
      dragSnapToOrigin={false}
      onDragEnd={interactive ? onDragEnd : undefined}
      style={motionStyle}
      className="absolute inset-0 touch-none select-none overflow-hidden will-change-transform"
    >
      <Image
        src={plate.image_url}
        alt={plate.dish_name ?? "Plate"}
        fill
        className="pointer-events-none object-cover select-none"
        priority={interactive}
        draggable={false}
        unoptimized
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

      {interactive && hotOpacity && notOpacity ? (
        <>
          <motion.div
            style={{ opacity: hotOpacity }}
            className="pointer-events-none absolute left-5 top-8 rotate-[-18deg] rounded-lg border-4 border-hot px-4 py-2 text-3xl font-black tracking-wider text-hot"
          >
            HOT
          </motion.div>
          <motion.div
            style={{ opacity: notOpacity }}
            className="pointer-events-none absolute right-5 top-8 rotate-[18deg] rounded-lg border-4 border-gray-300 px-4 py-2 text-3xl font-black tracking-wider text-gray-200"
          >
            NOT
          </motion.div>
        </>
      ) : null}

      <FeedPlateOverlay
        score={plate.score}
        username={plate.username}
        displayName={plate.display_name}
        verified={plate.is_verified}
        title={plate.dish_name ?? "Plate"}
        subtitle={plate.restaurant_name}
        isFollowing={showFollowingBadge && plate.is_following}
      />
    </motion.div>
  );
}

export function RateFeed({
  filter = "everyone",
  onFollowingCountChange,
  onStreakChange,
  onSwitchToExplore,
}: {
  filter?: FeedFilter;
  onFollowingCountChange?: (count: number) => void;
  onStreakChange?: (info: { ratedToday: number; streak: number }) => void;
  onSwitchToExplore?: () => void;
}) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const registered = isRegisteredUser(user);
  const userId = registered ? user.id : null;
  const [plates, setPlates] = useState<FeedPlate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], [-22, 0, 22]);
  const hotOpacity = useTransform(x, [0, 50, 120], [0, 0.55, 1]);
  const notOpacity = useTransform(x, [-120, -50, 0], [1, 0.55, 0]);

  const absX = useTransform(x, (value) => Math.abs(value));
  const nextScale = useTransform(absX, [0, 240], [0.92, 1]);
  const nextY = useTransform(absX, [0, 240], [16, 0]);
  const nextOpacity = useTransform(absX, [0, 200], [0.86, 1]);

  const publishStreak = useCallback(
    (ratedToday: number, streak: number) => {
      onStreakChange?.({ ratedToday, streak });
    },
    [onStreakChange]
  );

  const loadFeed = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? getAccessToken();
    if (!token || !userId) return false;

    const timezone = encodeURIComponent(getUserTimezone());
    const res = await fetch(`/api/feed?filter=${filter}&timezone=${timezone}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPlates(data.plates ?? []);
    const count = data.following_count ?? 0;
    onFollowingCountChange?.(count);
    if (typeof data.rated_today_count === "number") {
      syncRatedToday(userId, data.rated_today_count);
      publishStreak(data.rated_today_count, getStreak(userId).count);
    }
    setIndex(0);
    x.set(0);
    setLoading(false);
    setRefreshing(false);
    return true;
  }, [filter, getAccessToken, onFollowingCountChange, publishStreak, userId, x]);

  useEffect(() => {
    async function init() {
      if (authLoading) return;

      if (!registered || !userId) {
        onStreakChange?.({ ratedToday: 0, streak: 0 });
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const s = getStreak(userId);
      publishStreak(s.ratedToday, s.count);
      setLoading(true);
      await loadFeed(token);
    }
    init();
  }, [authLoading, registered, userId, getAccessToken, loadFeed, filter, publishStreak, onStreakChange]);

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

    if (!userId) return;

    const previousStreak = getStreak(userId).count;
    const s = recordRating(userId);
    publishStreak(s.ratedToday, s.count);

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
    const destination = rating === 1 ? EXIT_X : -EXIT_X;

    await animate(x, destination, {
      duration: 0.28,
      ease: EXIT_EASE,
    });

    void submitRating(current.id, rating);
    setIndex((i) => i + 1);
    x.set(0);
    setIsLeaving(false);
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (isLeaving) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    const passedRight = offset > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY;
    const passedLeft = offset < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY;

    if (passedRight) {
      void flyOff(1);
      return;
    }

    if (passedLeft) {
      void flyOff(0);
      return;
    }

    void animate(x, 0, SNAP_BACK_SPRING);
  }

  async function refreshFeed() {
    setRefreshing(true);
    await loadFeed();
  }

  if (!authLoading && !registered) {
    return (
      <div className="h-full">
        <FeedSignInPrompt
          title="sign in to rate plates"
          description="Explore posts for free. Create an account to swipe hot or not."
        />
      </div>
    );
  }

  let body: ReactNode;

  if (loading) {
    body = (
      <div className="flex h-full items-center justify-center px-page">
        <p className={feedLoadingClass}>Loading plates to rate...</p>
      </div>
    );
  } else if (!current) {
    const caughtUp = plates.length > 0;

    if (filter === "following") {
      body = <FollowingFeedEmptyState />;
    } else {
      body = (
        <FeedViewportEmpty
          title={caughtUp ? "You've seen everything" : "No plates to rate yet"}
          description={
            caughtUp
              ? "Explore posts and leave comments, or check back later for new plates."
              : "Explore what others posted or find people on Top to follow."
          }
        >
          <div className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              onClick={onSwitchToExplore}
              className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
            >
              Explore posts
            </button>
            {caughtUp ? (
              <button
                type="button"
                onClick={refreshFeed}
                disabled={refreshing}
                className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            ) : (
              <Link
                href="/leaderboard"
                className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold"
              >
                View Top
              </Link>
            )}
            <Link
              href="/post"
              className="text-sm font-medium text-gray-400 hover:text-hot"
            >
              Post your plate
            </Link>
          </div>
        </FeedViewportEmpty>
      );
    }
  } else {
    body = (
      <div className="grid h-full min-h-0 touch-none gap-6 px-page pb-4 pt-1 grid-rows-[1fr_auto]">
        <div className={`relative min-h-0 w-full ${feedCardShellClass}`}>
          <div className={feedRateCardMediaClass}>
            {next ? (
              <SwipeCard
                key={next.id}
                plate={next}
                showFollowingBadge={filter !== "following"}
                motionStyle={{
                  scale: nextScale,
                  y: nextY,
                  opacity: nextOpacity,
                  zIndex: 0,
                }}
              />
            ) : null}

            <SwipeCard
              key={current.id}
              plate={current}
              interactive
              showFollowingBadge={filter !== "following"}
              hotOpacity={hotOpacity}
              notOpacity={notOpacity}
              onDragEnd={onDragEnd}
              motionStyle={{
                x,
                rotate,
                zIndex: 10,
                touchAction: "none",
              }}
            />
          </div>
        </div>

        <div className="flex min-h-[var(--feed-actions-height)] shrink-0 items-center justify-center gap-6 pt-1 sm:gap-8">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={isLeaving}
            onClick={() => void flyOff(0)}
            className={`${BUTTON_SIZE} flex items-center justify-center rounded-full border border-border bg-surface disabled:opacity-50`}
            aria-label="Not"
          >
            <AppIcon kind="not" size={ICON_SIZE} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={isLeaving}
            onClick={() => void flyOff(1)}
            className={`${BUTTON_SIZE} flex items-center justify-center rounded-full border border-hot/50 bg-surface shadow-lg shadow-hot/20 disabled:opacity-50`}
            aria-label="Hot"
          >
            <AppIcon kind="flame" size={ICON_SIZE} />
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-full w-full">
      {body}
    </div>
  );
}

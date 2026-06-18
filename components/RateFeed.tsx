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
import { FeedPlateOverlay } from "@/components/FeedPlateOverlay";
import { getStreak, recordRating } from "@/lib/streak";
import { track } from "@/lib/analytics";
import { feedLoadingClass } from "@/lib/feed-ui";
import { FeedSignInPrompt } from "@/components/FeedSignInPrompt";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";
import { FollowingFeedEmptyState } from "@/components/FollowingFeedEmptyState";
import { isRegisteredUser } from "@/lib/auth-user";

interface FeedPlate {
  id: string;
  image_url: string;
  caption: string | null;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  username: string;
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
      dragMomentum={false}
      dragElastic={0.15}
      dragSnapToOrigin={false}
      onDragEnd={interactive ? onDragEnd : undefined}
      style={motionStyle}
      className="absolute inset-x-0 top-0 bottom-[var(--feed-actions-height)] touch-none select-none overflow-hidden rounded-2xl bg-surface shadow-2xl will-change-transform"
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
        title={plate.dish_name ?? "Plate"}
        subtitle={plate.restaurant_name}
      />
    </motion.div>
  );
}

export function RateFeed({ scope = "foryou" }: { scope?: "foryou" | "following" }) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const registered = isRegisteredUser(user);
  const [plates, setPlates] = useState<FeedPlate[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingHasPosts, setFollowingHasPosts] = useState(false);
  const [index, setIndex] = useState(0);
  const [ratedToday, setRatedToday] = useState(0);
  const [streak, setStreak] = useState(0);
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
    x.set(0);
    setLoading(false);
    setRefreshing(false);
    return true;
  }, [getAccessToken, scope, x]);

  useEffect(() => {
    async function init() {
      if (authLoading) return;

      if (!registered) {
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const s = getStreak();
      setStreak(s.count);
      setRatedToday(s.ratedToday);
      await loadFeed(token);
    }
    init();
  }, [authLoading, registered, getAccessToken, loadFeed, scope]);

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
      <FeedSignInPrompt
        title={scope === "following" ? "sign in to see following" : "sign in to rate plates"}
        description="Browse posts for free. Create an account to swipe hot or not."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-page">
        <p className={feedLoadingClass}>Loading plates to rate...</p>
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
      <FeedViewportEmpty
        title={caughtUp ? "you've seen everything" : "nothing to rate yet"}
        description={
          caughtUp
            ? "Switch to Browse to see all posts and leave comments."
            : "Plates from other people will show up here. Post yours and invite friends to join."
        }
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={refreshFeed}
            disabled={refreshing}
            className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold disabled:opacity-50"
          >
            {refreshing ? "refreshing..." : "refresh"}
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
    <div className="relative mx-auto h-full w-full touch-none px-feed">
      <div className="absolute right-3 top-2 z-20 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/60 px-3 py-1 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1">
          <AppIcon kind="flame" size={16} />
          {ratedToday} rated today
        </span>
        {streak > 0 ? ` · Day ${streak} streak` : ""}
      </div>

      <div className="absolute inset-x-0 top-2 bottom-[var(--feed-actions-height)]">
        {next ? (
          <SwipeCard
            key={next.id}
            plate={next}
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

      <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-6 px-page sm:gap-8">
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

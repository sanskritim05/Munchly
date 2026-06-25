"use client";

import { useEffect, useRef, useState } from "react";
import { BrowseFeed } from "@/components/BrowseFeed";
import { FeedFilterToggle } from "@/components/FeedFilterToggle";
import { FeedTabBar } from "@/components/FeedTabBar";
import { PeopleSearchButton, PeopleSearchOverlay } from "@/components/PeopleSearchOverlay";
import { RateFeed } from "@/components/RateFeed";
import { RateIntroOverlay } from "@/components/RateIntroOverlay";
import { RateStreakBadge } from "@/components/RateStreakBadge";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/analytics";
import { isRegisteredUser } from "@/lib/auth-user";
import { hasSeenRateIntro, markRateIntroSeen } from "@/lib/rate-intro-prompt";
import { getStreak } from "@/lib/streak";
import {
  FeedFilter,
  FeedTab,
  getStoredFeedFilter,
  getStoredFeedTab,
  setStoredFeedFilter,
  setStoredFeedTab,
} from "@/lib/feed-scope";

export function SwipeFeed() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<FeedTab>("explore");
  const [filter, setFilter] = useState<FeedFilter>("everyone");
  const [followingCount, setFollowingCount] = useState(0);
  const [rateStreak, setRateStreak] = useState({ ratedToday: 0, streak: 0 });
  const [showRateIntro, setShowRateIntro] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const tracked = useRef(false);
  const registered = isRegisteredUser(user);
  const userId = registered ? user.id : null;

  useEffect(() => {
    if (authLoading) return;

    const storedTab = getStoredFeedTab();
    const storedFilter = getStoredFeedFilter();

    if (!registered) {
      setTab("explore");
      setFilter("everyone");
      return;
    }

    setTab(storedTab);
    setFilter(storedFilter);
  }, [authLoading, registered]);

  useEffect(() => {
    if (!userId) {
      setRateStreak({ ratedToday: 0, streak: 0 });
      return;
    }

    const s = getStreak(userId);
    setRateStreak({ ratedToday: s.ratedToday, streak: s.count });
  }, [userId, tab]);

  useEffect(() => {
    if (authLoading || !registered || !userId || tab !== "rate") return;
    if (!hasSeenRateIntro(userId)) {
      setShowRateIntro(true);
    }
  }, [authLoading, registered, userId, tab]);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void track("swipe_session_started");
  }, []);

  function onTabChange(nextTab: FeedTab) {
    setTab(nextTab);
    setStoredFeedTab(nextTab);
  }

  function onFilterChange(nextFilter: FeedFilter) {
    setFilter(nextFilter);
    setStoredFeedFilter(nextFilter);
  }

  function switchToExplore() {
    onTabChange("explore");
  }

  function dismissRateIntro() {
    if (userId) {
      markRateIntroSeen(userId);
      void track("rate_intro_dismissed");
    }
    setShowRateIntro(false);
  }

  return (
    <div className="app-container grid h-page w-full grid-rows-[auto_1fr] overflow-hidden">
      <div className="shrink-0 bg-[var(--bg)] px-page py-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FeedTabBar tab={tab} onChange={onTabChange} />
          </div>
          <PeopleSearchButton onClick={() => setSearchOpen(true)} />
        </div>
        {registered ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <FeedFilterToggle
              filter={filter}
              onChange={onFilterChange}
              followingCount={followingCount}
            />
            {tab === "rate" ? (
              <RateStreakBadge
                ratedToday={rateStreak.ratedToday}
                streak={rateStreak.streak}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <PeopleSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div
        className={`min-h-0 h-full ${
          tab === "explore" ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {tab === "explore" ? (
          <BrowseFeed
            filter={filter}
            onFollowingCountChange={setFollowingCount}
          />
        ) : (
          <RateFeed
            filter={filter}
            onFollowingCountChange={setFollowingCount}
            onStreakChange={setRateStreak}
            onSwitchToExplore={switchToExplore}
          />
        )}
      </div>
      <RateIntroOverlay open={showRateIntro && tab === "rate"} onClose={dismissRateIntro} />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { BrowseFeed } from "@/components/BrowseFeed";
import { FeedTabBar } from "@/components/FeedTabBar";
import { PeopleSearchButton, PeopleSearchOverlay } from "@/components/PeopleSearchOverlay";
import { RateFeed } from "@/components/RateFeed";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/analytics";
import { isRegisteredUser } from "@/lib/auth-user";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const tracked = useRef(false);
  const registered = isRegisteredUser(user);

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

  return (
    <div className="app-container flex h-page w-full flex-col overflow-hidden">
      <div className="shrink-0 bg-[var(--bg)] px-feed py-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FeedTabBar tab={tab} onChange={onTabChange} />
          </div>
          <PeopleSearchButton onClick={() => setSearchOpen(true)} />
        </div>
      </div>
      <PeopleSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div
        className={`min-h-0 flex-1 ${
          tab === "explore" ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {tab === "explore" ? (
          <BrowseFeed filter={filter} onFilterChange={onFilterChange} />
        ) : (
          <RateFeed filter={filter} onFilterChange={onFilterChange} onSwitchToExplore={switchToExplore} />
        )}
      </div>
    </div>
  );
}

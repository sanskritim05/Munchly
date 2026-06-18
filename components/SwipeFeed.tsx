"use client";

import { useEffect, useRef, useState } from "react";
import { BrowseFeed } from "@/components/BrowseFeed";
import { FeedTabBar } from "@/components/FeedTabBar";
import { RateFeed } from "@/components/RateFeed";
import { track } from "@/lib/analytics";
import { FeedTab, getStoredFeedTab, setStoredFeedTab } from "@/lib/feed-scope";

export function SwipeFeed() {
  const [tab, setTab] = useState<FeedTab>("for_you");
  const tracked = useRef(false);

  useEffect(() => {
    setTab(getStoredFeedTab());
  }, []);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void track("swipe_session_started");
  }, []);

  function onTabChange(nextTab: FeedTab) {
    setTab(nextTab);
    setStoredFeedTab(nextTab);
  }

  return (
    <div className="app-container flex h-page w-full flex-col overflow-hidden">
      <div className="shrink-0 bg-[var(--bg)] px-feed py-2">
        <FeedTabBar tab={tab} onChange={onTabChange} />
      </div>
      <div
        className={`min-h-0 flex-1 ${
          tab === "browse" ? "overflow-x-hidden overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {tab === "browse" ? (
          <BrowseFeed />
        ) : (
          <RateFeed scope={tab === "following" ? "following" : "foryou"} />
        )}
      </div>
    </div>
  );
}

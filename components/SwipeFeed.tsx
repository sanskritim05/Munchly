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
    <div className="mx-auto max-w-lg">
      <div className="sticky top-0 z-30 bg-black px-4 py-3">
        <FeedTabBar tab={tab} onChange={onTabChange} />
      </div>
      {tab === "browse" ? (
        <BrowseFeed />
      ) : (
        <RateFeed scope={tab === "following" ? "following" : "foryou"} />
      )}
    </div>
  );
}

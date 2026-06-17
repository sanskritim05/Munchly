export const RMP_FEED_TAB_KEY = "rmp_feed_tab";

export type FeedTab = "for_you" | "following" | "browse";

export function getStoredFeedTab(): FeedTab {
  if (typeof window === "undefined") return "for_you";

  const value = localStorage.getItem(RMP_FEED_TAB_KEY);
  if (value === "following" || value === "browse") return value;
  if (value === "foryou") return "for_you";
  return "for_you";
}

export function setStoredFeedTab(tab: FeedTab) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RMP_FEED_TAB_KEY, tab);
}

/** Height of feed card area below tab bar, above bottom nav */
export const FEED_VIEWPORT_HEIGHT = "var(--feed-height)";

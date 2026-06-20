export const RMP_FEED_TAB_KEY = "rmp_feed_tab";
export const RMP_FEED_FILTER_KEY = "rmp_feed_filter";

export type FeedTab = "rate" | "explore";
export type FeedFilter = "everyone" | "following";

export function getStoredFeedTab(): FeedTab {
  if (typeof window === "undefined") return "explore";

  const value = localStorage.getItem(RMP_FEED_TAB_KEY);
  if (value === "rate" || value === "explore") return value;
  if (value === "browse") return "explore";
  if (value === "for_you" || value === "following" || value === "foryou") return "rate";
  return "explore";
}

export function setStoredFeedTab(tab: FeedTab) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RMP_FEED_TAB_KEY, tab);
}

export function getStoredFeedFilter(): FeedFilter {
  if (typeof window === "undefined") return "everyone";

  const value = localStorage.getItem(RMP_FEED_FILTER_KEY);
  if (value === "following") return "following";
  return "everyone";
}

export function setStoredFeedFilter(filter: FeedFilter) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RMP_FEED_FILTER_KEY, filter);
}

/** Height of feed card area below tab bar, above bottom nav */
export const FEED_VIEWPORT_HEIGHT = "var(--feed-height)";

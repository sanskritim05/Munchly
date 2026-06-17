export const RMP_RATINGS_COUNT_KEY = "rmp_ratings_count";
export const RATING_GATE_REQUIRED = 3;

export function getLocalRatingsCount() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(RMP_RATINGS_COUNT_KEY) ?? 0);
}

export function setLocalRatingsCount(count: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RMP_RATINGS_COUNT_KEY, String(count));
}

export function incrementLocalRatingsCount() {
  setLocalRatingsCount(getLocalRatingsCount() + 1);
}

export function hasPostingAccess(localCount: number, profileCount: number) {
  return Math.max(localCount, profileCount) >= RATING_GATE_REQUIRED;
}

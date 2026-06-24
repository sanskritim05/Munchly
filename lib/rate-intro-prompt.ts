const RATE_INTRO_VERSION = "v1";

function storageKey(userId: string) {
  return `rmp_seen_rate_intro_${RATE_INTRO_VERSION}:${userId}`;
}

export function hasSeenRateIntro(userId: string) {
  if (typeof window === "undefined" || !userId) return true;
  return localStorage.getItem(storageKey(userId)) === "true";
}

export function markRateIntroSeen(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(storageKey(userId), "true");
}

import { normalizeUsername } from "@/lib/username";

export const MAX_DAILY_PLATES = 3;
export const UNLIMITED_PLATE_USERNAME = "munchly";

export function hasUnlimitedPlates(username: string | null | undefined) {
  return normalizeUsername(username ?? "") === UNLIMITED_PLATE_USERNAME;
}

export function isValidTimezone(timeZone: string) {
  if (!timeZone) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getLocalDayStart(timeZone: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;

  const y = Number(pick("year"));
  const m = Number(pick("month"));
  const d = Number(pick("day"));

  const readsAsMidnightOnDay = (instant: Date) => {
    const dayParts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);

    const py = Number(dayParts.find((p) => p.type === "year")!.value);
    const pm = Number(dayParts.find((p) => p.type === "month")!.value);
    const pd = Number(dayParts.find((p) => p.type === "day")!.value);
    const ph = Number(dayParts.find((p) => p.type === "hour")!.value);
    const pmin = Number(dayParts.find((p) => p.type === "minute")!.value);
    const ps = Number(dayParts.find((p) => p.type === "second")!.value);

    return py === y && pm === m && pd === d && ph === 0 && pmin === 0 && ps === 0;
  };

  const anchor = Date.UTC(y, m - 1, d, 12, 0, 0);

  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const candidate = new Date(anchor + offsetHours * 3_600_000);
    if (readsAsMidnightOnDay(candidate)) return candidate;
  }

  for (let offsetMs = -16 * 3_600_000; offsetMs <= 16 * 3_600_000; offsetMs += 60_000) {
    const candidate = new Date(anchor + offsetMs);
    if (readsAsMidnightOnDay(candidate)) return candidate;
  }

  throw new Error(`Unable to compute day start for ${timeZone}`);
}

export function getLocalDayStartIso(timeZone: string, now = new Date()) {
  return getLocalDayStart(timeZone, now).toISOString();
}

export function isAtDailyPlateLimit(
  postsTodayCount: number,
  username: string | null | undefined
) {
  if (hasUnlimitedPlates(username)) return false;
  return postsTodayCount >= MAX_DAILY_PLATES;
}

export function dailyPlateLimitMessage(max = MAX_DAILY_PLATES) {
  return `You've reached your daily limit for posting (${max} plates per day). Your limit resets at midnight.`;
}

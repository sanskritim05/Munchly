const DAILY_GOAL = 5;

interface StreakData {
  count: number;
  date: string;
  ratedToday: number;
}

function storageKeys(userId: string) {
  return {
    streak: `rmp_streak:${userId}`,
    date: `rmp_streak_date:${userId}`,
    ratedToday: `rmp_rated_today:${userId}`,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreak(userId: string): StreakData {
  if (typeof window === "undefined" || !userId) {
    return { count: 0, date: today(), ratedToday: 0 };
  }

  const keys = storageKeys(userId);
  const date = localStorage.getItem(keys.date) ?? today();
  const ratedToday = Number(localStorage.getItem(keys.ratedToday) ?? 0);
  const count = Number(localStorage.getItem(keys.streak) ?? 0);

  if (date !== today()) {
    return {
      count: date === yesterday() && ratedToday >= DAILY_GOAL ? count : 0,
      date: today(),
      ratedToday: 0,
    };
  }

  return { count, date, ratedToday };
}

export function syncRatedToday(userId: string, ratedToday: number) {
  if (typeof window === "undefined" || !userId) return;

  const keys = storageKeys(userId);
  localStorage.setItem(keys.date, today());
  localStorage.setItem(keys.ratedToday, String(ratedToday));
}

export function recordRating(userId: string) {
  const current = getStreak(userId);
  const ratedToday = current.date === today() ? current.ratedToday + 1 : 1;
  let count = current.count;

  if (current.date !== today()) {
    count = current.ratedToday >= DAILY_GOAL ? current.count + 1 : 1;
  } else if (ratedToday === DAILY_GOAL) {
    count = Math.max(count, 1);
  }

  if (typeof window !== "undefined" && userId) {
    const keys = storageKeys(userId);
    localStorage.setItem(keys.streak, String(count));
    localStorage.setItem(keys.date, today());
    localStorage.setItem(keys.ratedToday, String(ratedToday));
  }

  return { count, ratedToday };
}

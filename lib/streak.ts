const STREAK_KEY = "rmp_streak";
const STREAK_DATE_KEY = "rmp_streak_date";
const DAILY_GOAL = 5;

interface StreakData {
  count: number;
  date: string;
  ratedToday: number;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") {
    return { count: 0, date: today(), ratedToday: 0 };
  }

  const date = localStorage.getItem(STREAK_DATE_KEY) ?? today();
  const ratedToday = Number(localStorage.getItem("rmp_rated_today") ?? 0);
  const count = Number(localStorage.getItem(STREAK_KEY) ?? 0);

  if (date !== today()) {
    return { count: date === yesterday() && ratedToday >= DAILY_GOAL ? count : 0, date: today(), ratedToday: 0 };
  }

  return { count, date, ratedToday };
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function recordRating() {
  const current = getStreak();
  const ratedToday = current.date === today() ? current.ratedToday + 1 : 1;
  let count = current.count;

  if (current.date !== today()) {
    count = current.ratedToday >= DAILY_GOAL ? current.count + 1 : 1;
  } else if (ratedToday === DAILY_GOAL) {
    count = Math.max(count, 1);
  }

  localStorage.setItem(STREAK_KEY, String(count));
  localStorage.setItem(STREAK_DATE_KEY, today());
  localStorage.setItem("rmp_rated_today", String(ratedToday));

  return { count, ratedToday };
}

import { createAdminClient } from "@/lib/supabase/admin";

function getWeekStartIso() {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart.toISOString();
}

function dayWindow(from: Date, daysAfter: number) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysAfter);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start: start.toISOString(), end: end.toISOString() };
}

export interface AdminMetrics {
  shareCardViewsThisWeek: number;
  shareToSignupRate: number;
  shareSignups: number;
  shareCardViewsTotal: number;
  d1Retention: number;
  d7Retention: number;
  signupCount: number;
  platesPostedThisWeek: number;
  averageSwipesPerSession: number;
  swipeSessionsThisWeek: number;
  topSharedPlates: {
    id: string;
    dish_name: string | null;
    share_view_count: number;
    score: number;
  }[];
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createAdminClient();
  const weekStart = getWeekStartIso();

  const [
    shareViewsWeekRes,
    shareViewsTotalRes,
    shareSignupsRes,
    platePostsWeekRes,
    swipeEventsRes,
    signupsRes,
    allEventsRes,
    topPlatesRes,
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "share_card_viewed")
      .gte("created_at", weekStart),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "share_card_viewed"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "signup_completed")
      .eq("properties->>source", "share_card"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "plate_posted")
      .gte("created_at", weekStart),
    supabase
      .from("events")
      .select("session_id")
      .eq("event_name", "swipe_completed")
      .gte("created_at", weekStart),
    supabase
      .from("events")
      .select("user_id, created_at")
      .eq("event_name", "signup_completed")
      .not("user_id", "is", null),
    supabase
      .from("events")
      .select("user_id, created_at")
      .not("user_id", "is", null),
    supabase
      .from("plates")
      .select("id, dish_name, share_view_count, score")
      .eq("is_active", true)
      .order("share_view_count", { ascending: false })
      .limit(5),
  ]);

  const eventQueryError =
    shareViewsWeekRes.error ??
    shareViewsTotalRes.error ??
    shareSignupsRes.error ??
    platePostsWeekRes.error ??
    swipeEventsRes.error ??
    signupsRes.error ??
    allEventsRes.error;

  if (eventQueryError) {
    throw new Error(
      eventQueryError.message.includes("events")
        ? "The events table is missing. Run supabase/events-migration.sql in Supabase."
        : eventQueryError.message
    );
  }

  const shareCardViewsThisWeek = shareViewsWeekRes.count ?? 0;
  const shareCardViewsTotal = shareViewsTotalRes.count ?? 0;
  const shareSignups = shareSignupsRes.count ?? 0;
  const platesPostedThisWeek = platePostsWeekRes.count ?? 0;

  const shareToSignupRate =
    shareCardViewsTotal > 0 ? shareSignups / shareCardViewsTotal : 0;

  const sessionCounts = new Map<string, number>();
  for (const row of swipeEventsRes.data ?? []) {
    sessionCounts.set(row.session_id, (sessionCounts.get(row.session_id) ?? 0) + 1);
  }

  const swipeSessionsThisWeek = sessionCounts.size;
  const totalSwipes = Array.from(sessionCounts.values()).reduce((sum, count) => sum + count, 0);
  const averageSwipesPerSession =
    swipeSessionsThisWeek > 0 ? totalSwipes / swipeSessionsThisWeek : 0;

  const signups = signupsRes.data ?? [];
  const signupCount = signups.length;

  const eventsByUser = new Map<string, string[]>();
  for (const event of allEventsRes.data ?? []) {
    if (!event.user_id) continue;
    const list = eventsByUser.get(event.user_id) ?? [];
    list.push(event.created_at);
    eventsByUser.set(event.user_id, list);
  }

  let d1Retained = 0;
  let d7Retained = 0;

  for (const signup of signups) {
    if (!signup.user_id) continue;

    const signupAt = new Date(signup.created_at);
    const userEvents = eventsByUser.get(signup.user_id) ?? [];
    const d1 = dayWindow(signupAt, 1);
    const d7 = dayWindow(signupAt, 7);

    const retainedD1 = userEvents.some(
      (createdAt) => createdAt >= d1.start && createdAt < d1.end
    );
    const retainedD7 = userEvents.some(
      (createdAt) => createdAt >= d7.start && createdAt < d7.end
    );

    if (retainedD1) d1Retained += 1;
    if (retainedD7) d7Retained += 1;
  }

  const d1Retention = signupCount > 0 ? d1Retained / signupCount : 0;
  const d7Retention = signupCount > 0 ? d7Retained / signupCount : 0;

  return {
    shareCardViewsThisWeek,
    shareToSignupRate,
    shareSignups,
    shareCardViewsTotal,
    d1Retention,
    d7Retention,
    signupCount,
    platesPostedThisWeek,
    averageSwipesPerSession,
    swipeSessionsThisWeek,
    topSharedPlates: (topPlatesRes.data ?? []).map((plate) => ({
      id: plate.id,
      dish_name: plate.dish_name,
      share_view_count: plate.share_view_count ?? 0,
      score: Number(plate.score ?? 0),
    })),
  };
}

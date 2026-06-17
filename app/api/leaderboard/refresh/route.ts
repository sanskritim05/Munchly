import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET ?? "dev-cron"}`;
}

async function refreshLeaderboard() {
  const supabase = createAdminClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: plates } = await supabase
    .from("plates")
    .select("id, user_id, score, hot_count, not_count")
    .gte("created_at", since.toISOString())
    .eq("is_active", true);

  const eligible = (plates ?? []).filter(
    (p) => (p.hot_count ?? 0) + (p.not_count ?? 0) >= 10
  );

  eligible.sort((a, b) => Number(b.score) - Number(a.score));
  const top10 = eligible.slice(0, 10);

  await supabase.from("leaderboard_weekly").delete().eq("week_start", weekStartStr);

  if (top10.length > 0) {
    await supabase.from("leaderboard_weekly").insert(
      top10.map((p, i) => ({
        plate_id: p.id,
        user_id: p.user_id,
        week_start: weekStartStr,
        score: p.score,
        hot_count: p.hot_count,
        rank: i + 1,
      }))
    );
  }

  return NextResponse.json({ updated: top10.length });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return refreshLeaderboard();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return refreshLeaderboard();
}

import { NextResponse } from "next/server";
import { refreshWeeklyLeaderboardCache } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET ?? "dev-cron"}`;
}

async function refreshLeaderboard() {
  const supabase = createAdminClient();
  const updated = await refreshWeeklyLeaderboardCache(supabase);
  return NextResponse.json({ updated });
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

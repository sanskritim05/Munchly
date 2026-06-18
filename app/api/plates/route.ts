import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import {
  dailyPlateLimitMessage,
  getLocalDayStartIso,
  isAtDailyPlateLimit,
  isValidTimezone,
} from "@/lib/plate-limits";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { image_url, location_text } = body;
  const restaurant_name = (body.restaurant_name ?? "").trim();
  const dish_name = (body.dish_name ?? "").trim().slice(0, 80);

  if (!image_url) {
    return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }

  if (!restaurant_name) {
    return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
  }

  if (!dish_name) {
    return NextResponse.json({ error: "What you ordered is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const rawTimezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  const timeZone = isValidTimezone(rawTimezone) ? rawTimezone : "UTC";
  const dayStart = getLocalDayStartIso(timeZone);

  const { count: postsTodayCount, error: countError } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayStart);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if (isAtDailyPlateLimit(postsTodayCount ?? 0, profile?.username)) {
    return NextResponse.json({ error: dailyPlateLimitMessage() }, { status: 403 });
  }

  const { data: plate, error } = await supabase
    .from("plates")
    .insert({
      user_id: user.id,
      image_url,
      caption: null,
      restaurant_name,
      location_text: location_text || null,
      dish_name,
    })
    .select("id")
    .single();

  if (error || !plate) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }

  const { data: profileStats } = await supabase
    .from("profiles")
    .select("total_plates")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ total_plates: (profileStats?.total_plates ?? 0) + 1 })
    .eq("id", user.id);

  return NextResponse.json({ id: plate.id, dish_name });
}

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { recalculateUserAverage } from "@/lib/profile-stats";
import { calculateScore } from "@/lib/scores";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plate_id, rating } = await request.json();

  if (!plate_id || ![0, 1].includes(rating)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("plate_id", plate_id)
    .eq("rater_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already rated" }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("ratings").insert({
    plate_id,
    rater_id: user.id,
    rating,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: plate } = await supabase
    .from("plates")
    .select("hot_count, not_count, user_id")
    .eq("id", plate_id)
    .single();

  if (!plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  const hot_count = plate.hot_count + (rating === 1 ? 1 : 0);
  const not_count = plate.not_count + (rating === 0 ? 1 : 0);
  const new_score = calculateScore(hot_count, not_count);

  const { error: updateError } = await supabase
    .from("plates")
    .update({ hot_count, not_count, score: new_score })
    .eq("id", plate_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await recalculateUserAverage(plate.user_id);

  return NextResponse.json({
    new_score,
    hot_count,
    not_count,
  });
}

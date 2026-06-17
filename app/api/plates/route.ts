import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_plates")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ total_plates: (profile?.total_plates ?? 0) + 1 })
    .eq("id", user.id);

  return NextResponse.json({ id: plate.id, dish_name });
}

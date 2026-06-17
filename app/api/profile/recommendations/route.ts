import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { reverseGeocode } from "@/lib/geocode";
import { getFoodRecommendations } from "@/lib/recommendations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;

  let locationLabel: string | null = null;
  if (lat !== null && lng !== null) {
    const place = await reverseGeocode(lat, lng);
    locationLabel = place?.label ?? null;
  }

  const supabase = createAdminClient();
  const { data: plates, error } = await supabase
    .from("plates")
    .select("dish_name, restaurant_name, score")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not("restaurant_name", "is", null)
    .not("dish_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const history = (plates ?? [])
    .filter((p) => p.restaurant_name && p.dish_name)
    .map((p) => ({
      restaurant_name: p.restaurant_name as string,
      dish_name: p.dish_name as string,
      score: Number(p.score),
    }));

  const result = await getFoodRecommendations(history, locationLabel);
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("plates")
    .select(
      `id, image_url, caption, dish_name, restaurant_name, score, hot_count, not_count, comment_count, created_at,
       profiles!plates_user_id_fkey (username, avatar_url)`
    )
    .eq("is_active", true)
    .neq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plates = (data ?? []).map((p) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.id,
      image_url: p.image_url,
      caption: p.caption,
      dish_name: p.dish_name,
      restaurant_name: p.restaurant_name,
      score: Number(p.score),
      hot_count: p.hot_count,
      not_count: p.not_count,
      comment_count: p.comment_count ?? 0,
      created_at: p.created_at,
      username: profile?.username ?? "anon",
      avatar_url: profile?.avatar_url,
    };
  });

  return NextResponse.json({ plates });
}

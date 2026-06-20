import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVerifiedProfile } from "@/lib/profile-verified";

async function getFollowingIds(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  return (data ?? []).map((row) => row.following_id);
}

function mapBrowsePlate(
  p: {
    id: string;
    image_url: string;
    caption: string | null;
    dish_name: string | null;
    restaurant_name: string | null;
    score: number | string;
    hot_count: number;
    not_count: number;
    comment_count: number | null;
    created_at: string;
    user_id: string;
    profiles:
      | { username: string | null; display_name: string | null; avatar_url: string | null; total_plates: number | null }
      | { username: string | null; display_name: string | null; avatar_url: string | null; total_plates: number | null }[]
      | null;
  },
  followingSet: Set<string>,
  forceFollowing: boolean
) {
  const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
  const username = profile?.username ?? "anon";
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
    username,
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url,
    is_following: forceFollowing || followingSet.has(p.user_id),
    is_verified: isVerifiedProfile({ username, total_plates: profile?.total_plates }),
  };
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") === "following" ? "following" : "everyone";

  if (filter === "following") {
    if (!isRegisteredAuthUser(user)) {
      return NextResponse.json({ plates: [], following_count: 0 });
    }

    const followingIds = await getFollowingIds(supabase, user!.id);
    if (followingIds.length === 0) {
      return NextResponse.json({ plates: [], following_count: 0 });
    }

    let query = supabase
      .from("plates")
      .select(
        `id, image_url, caption, dish_name, restaurant_name, score, hot_count, not_count, comment_count, created_at, user_id,
         profiles!plates_user_id_fkey (username, display_name, avatar_url, total_plates)`
      )
      .eq("is_active", true)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (isRegisteredAuthUser(user)) {
      query = query.neq("user_id", user!.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      plates: (data ?? []).map((p) => mapBrowsePlate(p, new Set(), true)),
      following_count: followingIds.length,
    });
  }

  let query = supabase
    .from("plates")
    .select(
      `id, image_url, caption, dish_name, restaurant_name, score, hot_count, not_count, comment_count, created_at, user_id,
       profiles!plates_user_id_fkey (username, display_name, avatar_url, total_plates)`
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (isRegisteredAuthUser(user)) {
    query = query.neq("user_id", user!.id);
  }

  const followingSet = isRegisteredAuthUser(user)
    ? new Set(await getFollowingIds(supabase, user!.id))
    : new Set<string>();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    plates: (data ?? []).map((p) => mapBrowsePlate(p, followingSet, false)),
    following_count: followingSet.size,
  });
}

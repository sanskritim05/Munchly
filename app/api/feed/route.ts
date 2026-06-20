import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function getFollowingIds(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  return (data ?? []).map((row) => row.following_id);
}

type RawPlate = {
  id: string;
  image_url: string;
  caption: string | null;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  hot_count: number;
  not_count: number;
  created_at: string;
  user_id: string;
  profiles:
    | { username: string | null; avatar_url: string | null }
    | { username: string | null; avatar_url: string | null }[]
    | null;
};

function mapPlate(p: RawPlate, followingSet: Set<string>) {
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
    username: profile?.username ?? "anon",
    avatar_url: profile?.avatar_url,
    is_following: followingSet.has(p.user_id),
  };
}

function orderEveryoneFeed(plates: RawPlate[], followingSet: Set<string>, ratedSet: Set<string>) {
  const unrated = plates.filter((p) => !ratedSet.has(p.id));
  const fromFollowing = unrated
    .filter((p) => followingSet.has(p.user_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const fromEveryone = shuffle(unrated.filter((p) => !followingSet.has(p.user_id)));

  return [...fromFollowing, ...fromEveryone]
    .slice(0, 30)
    .map((p) => mapPlate(p, followingSet));
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to rate plates" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") === "following" ? "following" : "everyone";

  const supabase = createAdminClient();

  const { data: rated } = await supabase
    .from("ratings")
    .select("plate_id")
    .eq("rater_id", user.id);

  const ratedSet = new Set((rated ?? []).map((r) => r.plate_id));
  const followingIds = await getFollowingIds(supabase, user.id);
  const followingSet = new Set(followingIds);

  if (filter === "following") {
    if (followingIds.length === 0) {
      return NextResponse.json({
        plates: [],
        following_count: 0,
        following_has_posts: false,
      });
    }

    const { count: postCount } = await supabase
      .from("plates")
      .select("id", { count: "exact", head: true })
      .in("user_id", followingIds)
      .eq("is_active", true);

    const followingHasPosts = (postCount ?? 0) > 0;

    const { data, error } = await supabase
      .from("plates")
      .select(
        `id, image_url, caption, dish_name, restaurant_name, score, hot_count, not_count, created_at, user_id,
         profiles!plates_user_id_fkey (username, avatar_url)`
      )
      .eq("is_active", true)
      .neq("user_id", user.id)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const plates = (data ?? [])
      .filter((p) => !ratedSet.has(p.id))
      .slice(0, 30)
      .map((p) => mapPlate(p as RawPlate, followingSet));

    return NextResponse.json({
      plates,
      following_count: followingIds.length,
      following_has_posts: followingHasPosts,
    });
  }

  const { data, error } = await supabase
    .from("plates")
    .select(
      `id, image_url, caption, dish_name, restaurant_name, score, hot_count, not_count, created_at, user_id,
       profiles!plates_user_id_fkey (username, avatar_url)`
    )
    .eq("is_active", true)
    .neq("user_id", user.id)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const plates = orderEveryoneFeed((data ?? []) as RawPlate[], followingSet, ratedSet);

  return NextResponse.json({
    plates,
    following_count: followingIds.length,
    following_has_posts: followingIds.length > 0,
  });
}

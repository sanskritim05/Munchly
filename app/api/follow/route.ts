import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getFollowerCount(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("follower_count")
    .eq("id", userId)
    .single();

  return data?.follower_count ?? 0;
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to follow people" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  return NextResponse.json({
    following: Boolean(data),
    follower_count: await getFollowerCount(supabase, userId),
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to follow people" }, { status: 401 });
  }

  const body = await request.json();
  const userId = body.user_id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      following: true,
      follower_count: await getFollowerCount(supabase, userId),
    });
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentCount = await getFollowerCount(supabase, userId);
  await supabase
    .from("profiles")
    .update({ follower_count: currentCount + 1 })
    .eq("id", userId);

  return NextResponse.json({
    following: true,
    follower_count: currentCount + 1,
  });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to follow people" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentCount = await getFollowerCount(supabase, userId);
  const nextCount = Math.max(currentCount - 1, 0);

  await supabase.from("profiles").update({ follower_count: nextCount }).eq("id", userId);

  return NextResponse.json({
    following: false,
    follower_count: nextCount,
  });
}

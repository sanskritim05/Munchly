import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to comment" }, { status: 401 });
  }

  const body = await request.json();
  const { plate_id, parent_id } = body;
  const content = (body.content ?? "").trim();

  if (!plate_id || !content) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: plate } = await supabase
    .from("plates")
    .select("id, user_id")
    .eq("id", plate_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  if (parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id, plate_id")
      .eq("id", parent_id)
      .maybeSingle();

    if (!parent || parent.plate_id !== plate_id) {
      return NextResponse.json({ error: "Invalid reply target" }, { status: 400 });
    }

    if (plate.user_id !== user.id) {
      return NextResponse.json({ error: "Only the plate owner can reply" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      plate_id,
      user_id: user.id,
      content,
      parent_id: parent_id || null,
    })
    .select("*, profiles!comments_user_id_fkey(username)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: plateRow } = await supabase
    .from("plates")
    .select("comment_count")
    .eq("id", plate_id)
    .single();

  await supabase
    .from("plates")
    .update({ comment_count: (plateRow?.comment_count ?? 0) + 1 })
    .eq("id", plate_id);

  return NextResponse.json({ comment: data });
}

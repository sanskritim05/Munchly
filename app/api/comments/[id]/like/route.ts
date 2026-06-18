import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Create an account to interact" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("id, like_count, plate_id, plates!inner(user_id)")
    .eq("id", params.id)
    .maybeSingle();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const plate = Array.isArray(comment.plates) ? comment.plates[0] : comment.plates;
  const plateOwnerId = (plate as { user_id: string })?.user_id;

  if (plateOwnerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked = false;
  let like_count = comment.like_count ?? 0;

  if (existing) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", params.id)
      .eq("user_id", user.id);
    like_count = Math.max(like_count - 1, 0);
    liked = false;
  } else {
    await supabase.from("comment_likes").insert({
      comment_id: params.id,
      user_id: user.id,
    });
    like_count += 1;
    liked = true;
  }

  await supabase.from("comments").update({ like_count }).eq("id", params.id);

  return NextResponse.json({ liked, like_count });
}

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("id, plate_id, plates!inner(user_id)")
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

  const { count: replyCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", params.id);

  const { error: deleteRepliesError } = await supabase
    .from("comments")
    .delete()
    .eq("parent_id", params.id);

  if (deleteRepliesError) {
    return NextResponse.json({ error: deleteRepliesError.message }, { status: 500 });
  }

  const { error } = await supabase.from("comments").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: plateRow } = await supabase
    .from("plates")
    .select("comment_count")
    .eq("id", comment.plate_id)
    .single();

  const removed = 1 + (replyCount ?? 0);
  await supabase
    .from("plates")
    .update({ comment_count: Math.max((plateRow?.comment_count ?? removed) - removed, 0) })
    .eq("id", comment.plate_id);

  return NextResponse.json({ ok: true });
}

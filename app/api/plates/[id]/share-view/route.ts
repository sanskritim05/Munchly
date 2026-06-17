import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const { data: plate, error: fetchError } = await supabase
    .from("plates")
    .select("share_view_count")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("plates")
    .update({ share_view_count: (plate.share_view_count ?? 0) + 1 })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

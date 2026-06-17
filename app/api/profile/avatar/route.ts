import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const avatar_url =
    body.avatar_url === null || body.avatar_url === undefined
      ? null
      : typeof body.avatar_url === "string"
        ? body.avatar_url
        : null;

  if (body.avatar_url !== null && body.avatar_url !== undefined && typeof body.avatar_url !== "string") {
    return NextResponse.json({ error: "Invalid avatar_url" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ avatar_url });
}

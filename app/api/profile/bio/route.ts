import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const bio = (body.bio ?? "").trim().slice(0, BIO_MAX_LENGTH);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio || null })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bio: bio || null });
}

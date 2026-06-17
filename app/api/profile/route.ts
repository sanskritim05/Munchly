import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const display_name = (body.display_name ?? "").trim().slice(0, 50);
  const username = normalizeUsername(body.username ?? "");
  const bio = (body.bio ?? "").trim().slice(0, BIO_MAX_LENGTH);

  if (!display_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters: letters, numbers, underscores" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name,
      bio: bio || null,
    })
    .eq("id", user.id)
    .select("username, display_name, bio")
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: error?.message ?? "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

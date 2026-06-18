import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import { getUsernameError, normalizeUsername } from "@/lib/username";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const display_name = (body.display_name ?? "").trim().slice(0, 50);
  const username = normalizeUsername(body.username ?? "");
  const bio = (body.bio ?? "").trim().slice(0, BIO_MAX_LENGTH);
  const avatar_url = body.avatar_url ?? null;

  if (!display_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const usernameError = getUsernameError(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
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
    .upsert(
      {
        id: user.id,
        username,
        bio: bio || null,
        avatar_url,
        display_name,
        onboarding_complete: true,
      },
      { onConflict: "id" }
    )
    .select("username")
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: error?.message ?? "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ username: profile.username });
}

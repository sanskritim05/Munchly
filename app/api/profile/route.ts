import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import {
  canChangeIdentity,
  identityChangeError,
} from "@/lib/profile-identity";
import { getUsernameError, normalizeUsername } from "@/lib/username";
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

  const usernameError = getUsernameError(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: current, error: currentError } = await supabase
    .from("profiles")
    .select("username, display_name, username_changed_at, display_name_changed_at")
    .eq("id", user.id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const usernameChanging = current.username !== username;
  const displayNameChanging = (current.display_name ?? "").trim() !== display_name;

  if (usernameChanging) {
    const error = identityChangeError("username", current.username_changed_at);
    if (error) {
      return NextResponse.json({ error }, { status: 429 });
    }
  }

  if (displayNameChanging) {
    const error = identityChangeError("name", current.display_name_changed_at);
    if (error) {
      return NextResponse.json({ error }, { status: 429 });
    }
  }

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
    .select(
      "username, display_name, bio, username_changed_at, display_name_changed_at"
    )
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: error?.message ?? "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    identity_limits: {
      username_change_allowed: canChangeIdentity(profile.username_changed_at),
      display_name_change_allowed: canChangeIdentity(profile.display_name_changed_at),
      username_changed_at: profile.username_changed_at,
      display_name_changed_at: profile.display_name_changed_at,
    },
  });
}

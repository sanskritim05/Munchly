import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth-server";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureFollowsOfficialAccount } from "@/lib/follows";
import { isValidPassword, PASSWORD_MIN_LENGTH, usernameAuthEmail } from "@/lib/username-auth";
import { getUsernameError, normalizeUsername } from "@/lib/username";

export async function POST(request: Request) {
  const body = await request.json();
  const display_name = (body.display_name ?? "").trim().slice(0, 50);
  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";
  const bio = (body.bio ?? "").trim().slice(0, BIO_MAX_LENGTH);

  if (!display_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const usernameError = getUsernameError(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const currentUser = await getUserFromRequest(request);
  const email = usernameAuthEmail(username);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfile && existingProfile.id !== currentUser?.id) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  let userId = currentUser?.id ?? null;

  if (currentUser?.is_anonymous) {
    const { data, error } = await supabase.auth.admin.updateUserById(currentUser.id, {
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create your account" },
        { status: 500 }
      );
    }

    userId = data.user.id;
  } else if (currentUser && !currentUser.is_anonymous) {
    return NextResponse.json({ error: "Already signed in" }, { status: 400 });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      const message = error?.message?.includes("already registered")
        ? "Username already taken"
        : error?.message ?? "Could not create your account";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    userId = data.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name,
      bio: bio || null,
      onboarding_complete: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await ensureFollowsOfficialAccount(supabase, userId);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const signInClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    return NextResponse.json(
      { error: signInError?.message ?? "Account created but sign-in failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    username,
  });
}

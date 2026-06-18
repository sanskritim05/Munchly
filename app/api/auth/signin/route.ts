import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  authEmailUsername,
  repairUsernameAuthLogin,
  syncAuthEmailForUsername,
  usernameAuthEmail,
} from "@/lib/username-auth";
import { isValidUsername, normalizeUsername } from "@/lib/username";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const body = await request.json();
  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Enter a valid username" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const signInClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = usernameAuthEmail(username);
  let session =
    (
      await signInClient.auth.signInWithPassword({
        email,
        password,
      })
    ).data.session ?? null;

  if (!session) {
    try {
      const admin = createAdminClient();
      session = await repairUsernameAuthLogin(admin, signInClient, username, password);
    } catch {
      session = null;
    }
  }

  if (!session) {
    return NextResponse.json(
      { error: "Wrong username or password" },
      { status: 401 }
    );
  }

  const signedInUsername = authEmailUsername(session.user.email);

  if (signedInUsername) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (
        profile?.username &&
        signedInUsername !== normalizeUsername(profile.username)
      ) {
        await syncAuthEmailForUsername(admin, session.user.id, profile.username);
      }
    } catch {
      // Login already succeeded; syncing can happen on the next sign-in.
    }
  }

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { usernameAuthEmail } from "@/lib/username-auth";
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

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameAuthEmail(username),
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: "Wrong username or password" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}

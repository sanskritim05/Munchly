import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check your .env file and restart the dev server." },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "Could not start guest session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Supabase. Check your connection and project URL." },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = body.event_name as string | undefined;
    const sessionId = body.session_id as string | undefined;
    const userId = (body.user_id as string | null | undefined) ?? null;
    const properties = body.properties ?? {};

    if (!eventName || !sessionId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();
    await supabase.from("events").insert({
      event_name: eventName,
      session_id: sessionId,
      user_id: userId,
      properties,
    });
  } catch {
    // always succeed from the client's perspective
  }

  return NextResponse.json({ ok: true });
}

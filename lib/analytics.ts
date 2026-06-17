"use client";

import { createBrowserClient } from "@/lib/supabase/client";

const SESSION_KEY = "rmp_session_id";
export const SIGNUP_SOURCE_KEY = "rmp_signup_source";

function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function markSignupSource(source: "share_card" | "direct") {
  try {
    sessionStorage.setItem(SIGNUP_SOURCE_KEY, source);
  } catch {
    // ignore
  }
}

export function consumeSignupSource(): "share_card" | "direct" {
  try {
    const value = sessionStorage.getItem(SIGNUP_SOURCE_KEY);
    sessionStorage.removeItem(SIGNUP_SOURCE_KEY);
    return value === "share_card" ? "share_card" : "direct";
  } catch {
    return "direct";
  }
}

export async function track(eventName: string, properties?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;

    const sessionId = getSessionId();
    let userId: string | null = null;

    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
    } catch {
      // ignore session lookup failures
    }

    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        properties: properties ?? {},
        session_id: sessionId,
        user_id: userId,
      }),
      keepalive: true,
    });
  } catch {
    // fail silently
  }
}

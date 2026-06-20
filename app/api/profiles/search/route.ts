import { NextResponse } from "next/server";
import {
  normalizeProfileSearchQuery,
  PROFILE_SEARCH_MIN_LENGTH,
  searchProfiles,
} from "@/lib/profile-search";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (normalizeProfileSearchQuery(q).length < PROFILE_SEARCH_MIN_LENGTH) {
    return NextResponse.json({ profiles: [] });
  }

  const supabase = createAdminClient();
  const profiles = await searchProfiles(supabase, q);

  return NextResponse.json({ profiles });
}

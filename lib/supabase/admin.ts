import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseUrl,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  assertSupabaseUrl(url);

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

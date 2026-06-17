import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  assertSupabaseUrl(url);

  if (!browserClient) {
    browserClient = createClient(url, key);
  }

  return browserClient;
}

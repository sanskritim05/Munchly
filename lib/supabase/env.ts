function cleanEnv(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

export function getSupabaseUrl() {
  return cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey() {
  return cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey() {
  return cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function assertSupabaseUrl(url: string) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Set it in Vercel → Settings → Environment Variables (no quotes), e.g. https://your-project.supabase.co"
    );
  }
}

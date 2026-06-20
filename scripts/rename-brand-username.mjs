import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_EMAIL_DOMAIN = "users.platecheck.app";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function authEmail(username) {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}

async function renameBrandUser(fromUsername, toUsername) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", fromUsername)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    console.log(`No profile found with username "${fromUsername}".`);
    return;
  }

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", toUsername)
    .neq("id", profile.id)
    .maybeSingle();

  if (taken) {
    throw new Error(`Username "${toUsername}" is already taken by another account.`);
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, {
    email: authEmail(toUsername),
    email_confirm: true,
    user_metadata: { username: toUsername },
  });

  if (authError) {
    throw new Error(`Auth update failed: ${authError.message}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username: toUsername, username_changed_at: null })
    .eq("id", profile.id);

  if (profileError) {
    throw new Error(`Profile update failed: ${profileError.message}`);
  }

  console.log(`Renamed @${fromUsername} -> @${toUsername} (${profile.id})`);
}

const from = process.argv[2] ?? "platecheck";
const to = process.argv[3] ?? "munchly";

renameBrandUser(from, to).catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

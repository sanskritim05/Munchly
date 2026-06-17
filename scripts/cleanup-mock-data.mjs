/**
 * One-time cleanup for mock/demo users and plates before publishing.
 * Run: node scripts/cleanup-mock-data.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const MOCK_EMAIL_PATTERNS = [/@[^@]*platecheck\.test$/i, /@[^@]*ratemyplate\.test$/i];
const MOCK_USERNAMES = new Set([
  "foodie_maya",
  "samsam",
  "luca_eats",
  "jordan_plates",
  "riley_sips",
]);

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function isMockEmail(email) {
  return MOCK_EMAIL_PATTERNS.some((pattern) => pattern.test(email));
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: mockPlates, error: platesError } = await supabase
    .from("plates")
    .select("id, image_url")
    .or("image_url.ilike.%/mock-plates/%,image_url.ilike.%mock-plate%");

  if (platesError) {
    console.error("Failed to list mock plates:", platesError.message);
    process.exit(1);
  }

  if (mockPlates?.length) {
    const ids = mockPlates.map((plate) => plate.id);
    const { error: deletePlatesError } = await supabase.from("plates").delete().in("id", ids);
    if (deletePlatesError) {
      console.error("Failed to delete mock plates:", deletePlatesError.message);
      process.exit(1);
    }
    console.log(`Deleted ${ids.length} mock plate(s).`);
  } else {
    console.log("No mock plates found.");
  }

  const { data: activePlates } = await supabase.from("plates").select("id").eq("is_active", true);
  const activePlateIds = new Set((activePlates ?? []).map((plate) => plate.id));

  const { data: leaderboardRows } = await supabase.from("leaderboard_weekly").select("id, plate_id");
  const staleLeaderboardIds = (leaderboardRows ?? [])
    .filter((row) => !row.plate_id || !activePlateIds.has(row.plate_id))
    .map((row) => row.id);

  if (staleLeaderboardIds.length > 0) {
    await supabase.from("leaderboard_weekly").delete().in("id", staleLeaderboardIds);
    console.log(`Removed ${staleLeaderboardIds.length} stale leaderboard row(s).`);
  }

  const { data: profileList, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", [...MOCK_USERNAMES]);

  if (profilesError) {
    console.error("Failed to list mock profiles:", profilesError.message);
    process.exit(1);
  }

  const mockProfileIds = new Set((profileList ?? []).map((profile) => profile.id));

  const { data: userList, error: usersError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (usersError) {
    console.error("Failed to list users:", usersError.message);
    process.exit(1);
  }

  const mockUserIds = new Set();

  for (const user of userList?.users ?? []) {
    const email = user.email ?? "";
    if (isMockEmail(email) || mockProfileIds.has(user.id)) {
      mockUserIds.add(user.id);
    }
  }

  for (const profile of profileList ?? []) {
    mockUserIds.add(profile.id);
  }

  if (mockUserIds.size > 0) {
    const ids = [...mockUserIds];

    await supabase.from("ratings").delete().in("rater_id", ids);
    await supabase.from("plates").delete().in("user_id", ids);
    await supabase.from("profiles").delete().in("id", ids);

    let deletedUsers = 0;

    for (const userId of ids) {
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        console.error(`Failed to delete user ${userId}:`, deleteUserError.message);
        continue;
      }

      deletedUsers += 1;
      console.log(`Deleted user: ${userId}`);
    }

    if (deletedUsers === 0) {
      console.log("No mock users deleted from auth.");
    } else {
      console.log(`Deleted ${deletedUsers} mock user(s).`);
    }
  } else {
    console.log("No mock users found.");
  }

  console.log("Cleanup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

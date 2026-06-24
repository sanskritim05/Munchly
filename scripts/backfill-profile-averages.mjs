/**
 * Recompute and sync profile average_score for every user.
 * Run: node scripts/backfill-profile-averages.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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

function computeProfileAverage(plates) {
  const rated = plates.filter((plate) => plate.hot_count + plate.not_count > 0);
  if (rated.length === 0) return 0;

  return (
    Math.round(
      (rated.reduce((sum, plate) => sum + Number(plate.score), 0) / rated.length) * 100
    ) / 100
  );
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: profiles, error: profilesError } = await supabase
  .from("profiles")
  .select("id, username, average_score");

if (profilesError) {
  console.error(profilesError.message);
  process.exit(1);
}

let updated = 0;

for (const profile of profiles ?? []) {
  const { data: plates, error: platesError } = await supabase
    .from("plates")
    .select("score, hot_count, not_count")
    .eq("user_id", profile.id)
    .eq("is_active", true);

  if (platesError) {
    console.error(`Failed plates for @${profile.username}:`, platesError.message);
    continue;
  }

  const average = computeProfileAverage(plates ?? []);
  const stored = Number(profile.average_score ?? 0);

  if (Math.abs(average - stored) < 0.005) continue;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ average_score: average })
    .eq("id", profile.id);

  if (updateError) {
    console.error(`Failed update for @${profile.username}:`, updateError.message);
    continue;
  }

  updated += 1;
  console.log(`@${profile.username}: ${stored} -> ${average}`);
}

console.log(`Done. Updated ${updated} profile(s).`);

/**
 * Wipes all app data and auth users for a fresh start.
 * Run: node scripts/reset-database.mjs --confirm
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

async function deleteAll(supabase, table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return 0;
    }
    throw new Error(`${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function deleteAllFollows(supabase) {
  const { error, count } = await supabase
    .from("follows")
    .delete({ count: "exact" })
    .neq("follower_id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return 0;
    }
    throw new Error(`follows: ${error.message}`);
  }

  return count ?? 0;
}

async function deleteAllCommentLikes(supabase) {
  const { error, count } = await supabase
    .from("comment_likes")
    .delete({ count: "exact" })
    .neq("comment_id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return 0;
    }
    throw new Error(`comment_likes: ${error.message}`);
  }

  return count ?? 0;
}

async function listStoragePaths(supabase, bucket, prefix = "") {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;

  const paths = [];

  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      paths.push(path);
    } else {
      paths.push(...(await listStoragePaths(supabase, bucket, path)));
    }
  }

  return paths;
}

async function emptyStorageBucket(supabase, bucket) {
  const paths = await listStoragePaths(supabase, bucket);
  if (paths.length === 0) return 0;

  const batchSize = 100;
  let removed = 0;

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) throw error;
    removed += batch.length;
  }

  return removed;
}

async function deleteAllAuthUsers(supabase) {
  let page = 1;
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`  Failed to delete auth user ${user.id}: ${deleteError.message}`);
        continue;
      }
      deleted += 1;
    }

    if (users.length < 1000) break;
    page += 1;
  }

  return deleted;
}

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.error("This deletes ALL users, plates, ratings, comments, and storage files.");
    console.error("Run: node scripts/reset-database.mjs --confirm");
    process.exit(1);
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Resetting Munchly database...\n");

  const steps = [
    ["comment_likes", () => deleteAllCommentLikes(supabase)],
    ["comments", () => deleteAll(supabase, "comments")],
    ["ratings", () => deleteAll(supabase, "ratings")],
    ["follows", () => deleteAllFollows(supabase)],
    ["leaderboard_weekly", () => deleteAll(supabase, "leaderboard_weekly")],
    ["events", () => deleteAll(supabase, "events")],
    ["plates", () => deleteAll(supabase, "plates")],
    ["profiles", () => deleteAll(supabase, "profiles")],
  ];

  for (const [table, fn] of steps) {
    const count = await fn();
    console.log(`  Cleared ${table}: ${count} row(s)`);
  }

  const storageCount = await emptyStorageBucket(supabase, "plates");
  console.log(`  Cleared storage (plates bucket): ${storageCount} file(s)`);

  const userCount = await deleteAllAuthUsers(supabase);
  console.log(`  Deleted auth users: ${userCount}`);

  console.log("\nDatabase reset complete. You can sign up fresh.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { isOfficialAccountUsername, isVerifiedProfile } from "@/lib/profile-verified";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isOfficialAccountUsername(profile.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("follows")
    .select(
      "follower_id, profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, total_plates)"
    )
    .eq("following_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const followers = (rows ?? [])
    .map((row) => {
      const follower = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!follower?.username) return null;
      return {
        id: follower.id as string,
        username: follower.username as string,
        display_name: (follower.display_name as string | null) ?? null,
        avatar_url: (follower.avatar_url as string | null) ?? null,
        verified: isVerifiedProfile({
          username: follower.username as string,
          total_plates: follower.total_plates as number | null,
        }),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    followers,
    count: followers.length,
  });
}

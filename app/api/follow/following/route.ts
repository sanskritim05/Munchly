import { NextResponse } from "next/server";
import { getUserFromRequest, isRegisteredAuthUser } from "@/lib/auth-server";
import { isVerifiedProfile } from "@/lib/profile-verified";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!isRegisteredAuthUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("follows")
    .select(
      "following_id, profiles!follows_following_id_fkey(id, username, display_name, avatar_url, total_plates)"
    )
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const following = (rows ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile?.username) return null;
      return {
        id: profile.id as string,
        username: profile.username as string,
        display_name: (profile.display_name as string | null) ?? null,
        avatar_url: (profile.avatar_url as string | null) ?? null,
        verified: isVerifiedProfile({
          username: profile.username as string,
          total_plates: profile.total_plates as number | null,
        }),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    following,
    count: following.length,
  });
}

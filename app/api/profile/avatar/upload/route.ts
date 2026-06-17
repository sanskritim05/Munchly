import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from("plates")
    .upload(path, file, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("plates").getPublicUrl(path);

  return NextResponse.json({ avatar_url: urlData.publicUrl });
}

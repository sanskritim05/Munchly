import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { deleteUserAccount } from "@/lib/account-delete";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    await deleteUserAccount(supabase, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not delete account";
    const status = message === "This account cannot be deleted." ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

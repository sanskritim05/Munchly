import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { recalculateUserAverage } from "@/lib/profile-stats";
import { createAdminClient } from "@/lib/supabase/admin";

async function getOwnedPlate(id: string, userId: string) {
  const supabase = createAdminClient();
  const { data: plate } = await supabase
    .from("plates")
    .select("id, user_id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!plate || !plate.is_active || plate.user_id !== userId) {
    return null;
  }

  return plate;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plate = await getOwnedPlate(params.id, user.id);
  if (!plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  const body = await request.json();
  const dish_name = (body.dish_name ?? "").trim().slice(0, 80);
  const restaurant_name = (body.restaurant_name ?? "").trim().slice(0, 80);

  if (!dish_name) {
    return NextResponse.json({ error: "What you ordered is required" }, { status: 400 });
  }

  if (!restaurant_name) {
    return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("plates")
    .update({ dish_name, restaurant_name })
    .eq("id", params.id)
    .select("id, dish_name, restaurant_name")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username) {
    revalidatePath(`/profile/${profile.username}`);
  }
  revalidatePath(`/plate/${params.id}`);

  return NextResponse.json({ plate: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plate = await getOwnedPlate(params.id, user.id);
  if (!plate) {
    return NextResponse.json({ error: "Plate not found" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("plates")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, total_plates")
    .eq("id", user.id)
    .single();

  const nextTotal = Math.max((profile?.total_plates ?? 1) - 1, 0);
  const average = await recalculateUserAverage(user.id);

  await supabase
    .from("profiles")
    .update({ total_plates: nextTotal, average_score: average })
    .eq("id", user.id);

  if (profile?.username) {
    revalidatePath(`/profile/${profile.username}`);
  }
  revalidatePath("/swipe");

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { analyzePlate } from "@/lib/groq";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image_url } = await request.json();
  if (!image_url) {
    return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }

  const analysis = await analyzePlate(image_url);
  return NextResponse.json(analysis);
}

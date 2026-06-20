import { NextResponse } from "next/server";
import { fetchLandingCarouselPlates } from "@/lib/landing-carousel";

export async function GET() {
  const plates = await fetchLandingCarouselPlates();
  return NextResponse.json({ plates });
}

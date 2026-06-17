import { NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/restaurant-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (q.length < 1) {
    return NextResponse.json({ restaurants: [] });
  }

  const location =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;

  const restaurants = await searchRestaurants(q, location);
  return NextResponse.json({ restaurants });
}

import { NextResponse } from "next/server";
import { searchUSRestaurants } from "@/lib/us-restaurants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ restaurants: [] });
  }

  const restaurants = searchUSRestaurants(q);
  return NextResponse.json({ restaurants });
}

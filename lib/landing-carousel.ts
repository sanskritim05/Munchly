import { createAdminClient } from "@/lib/supabase/admin";

export interface LandingCarouselPlate {
  id: string;
  image_url: string;
}

export const LANDING_CAROUSEL_ROW_COUNT = 6;
export const LANDING_CAROUSEL_PLATE_LIMIT = 60;
export const LANDING_CAROUSEL_MIN_TILES_PER_ROW = 24;

export const LANDING_CAROUSEL_SEED_PLATES: LandingCarouselPlate[] = [
  { id: "seed-01", image_url: "/landing-carousel/01-lakeside.png" },
  { id: "seed-02", image_url: "/landing-carousel/02-doughnuts.png" },
  { id: "seed-03", image_url: "/landing-carousel/03-italian-table.png" },
  { id: "seed-04", image_url: "/landing-carousel/04-fries.png" },
  { id: "seed-05", image_url: "/landing-carousel/05-cafe-drinks.png" },
  { id: "seed-06", image_url: "/landing-carousel/06-waffles.png" },
  { id: "seed-07", image_url: "/landing-carousel/07-gourmet-donuts.png" },
  { id: "seed-08", image_url: "/landing-carousel/08-pasta.png" },
];

function mergeCarouselPlates(
  dbPlates: LandingCarouselPlate[],
  limit: number
): LandingCarouselPlate[] {
  const seen = new Set<string>();
  const merged: LandingCarouselPlate[] = [];

  for (const plate of dbPlates) {
    if (seen.has(plate.image_url)) continue;
    seen.add(plate.image_url);
    merged.push(plate);
    if (merged.length >= limit) break;
  }

  // Only use bundled photos when there aren't enough user uploads yet.
  if (merged.length < LANDING_CAROUSEL_MIN_TILES_PER_ROW) {
    for (const plate of LANDING_CAROUSEL_SEED_PLATES) {
      if (seen.has(plate.image_url)) continue;
      seen.add(plate.image_url);
      merged.push(plate);
      if (merged.length >= limit) break;
    }
  }

  return merged;
}

export async function fetchLandingCarouselPlates(
  limit = LANDING_CAROUSEL_PLATE_LIMIT
) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("plates")
    .select("id, image_url")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  const dbPlates = (data ?? []).filter((plate) => plate.image_url) as LandingCarouselPlate[];
  return mergeCarouselPlates(dbPlates, limit);
}

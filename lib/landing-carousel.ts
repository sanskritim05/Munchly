import { createAdminClient } from "@/lib/supabase/admin";

export interface LandingCarouselPlate {
  id: string;
  image_url: string;
}

export const LANDING_CAROUSEL_ROW_COUNT = 6;
export const LANDING_CAROUSEL_PLATE_LIMIT = 360;
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

function dedupePlatesByImage(plates: LandingCarouselPlate[], limit: number) {
  const seen = new Set<string>();
  const unique: LandingCarouselPlate[] = [];

  for (const plate of plates) {
    if (!plate.image_url || seen.has(plate.image_url)) continue;
    seen.add(plate.image_url);
    unique.push(plate);
    if (unique.length >= limit) break;
  }

  return unique;
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

  const dbPlates = dedupePlatesByImage(
    (data ?? []).filter((plate) => plate.image_url) as LandingCarouselPlate[],
    limit
  );

  // Always keep seed plates so the backdrop never renders empty or sparse.
  return dedupePlatesByImage([...dbPlates, ...LANDING_CAROUSEL_SEED_PLATES], limit);
}

export interface LandingCarouselRowConfig {
  plates: LandingCarouselPlate[];
  offsetPx: number;
  gapClass: string;
  duration: number;
  reverse: boolean;
}

const ROW_GAPS = ["gap-1", "gap-2", "gap-1.5", "gap-2.5", "gap-1", "gap-2"] as const;
const ROW_DURATIONS = [42, 52, 45, 54, 48, 53] as const;
const ROW_OFFSETS = [0, 53, 127, 31, 98, 71] as const;

function shuffleRowDeterministic(row: LandingCarouselPlate[], seed: number) {
  const copy = [...row];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = (seed + i * 31) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
    seed += 17;
  }

  return copy;
}

export function buildCarouselRows(
  plates: LandingCarouselPlate[],
  rowCount = LANDING_CAROUSEL_ROW_COUNT
): LandingCarouselRowConfig[] {
  const source = plates.length > 0 ? plates : LANDING_CAROUSEL_SEED_PLATES;

  const targetCount =
    source.length >= LANDING_CAROUSEL_MIN_TILES_PER_ROW
      ? LANDING_CAROUSEL_MIN_TILES_PER_ROW
      : Math.max(LANDING_CAROUSEL_MIN_TILES_PER_ROW, source.length * 3);

  const rows: LandingCarouselPlate[][] = Array.from({ length: rowCount }, () => []);
  const usedInRow = Array.from({ length: rowCount }, () => new Set<string>());

  let cursor = 0;
  const maxPasses = targetCount * rowCount * 4;

  for (let pass = 0; pass < maxPasses; pass++) {
    let placedAny = false;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      if (rows[rowIndex].length >= targetCount) continue;

      let placed = false;

      for (let attempt = 0; attempt < source.length; attempt++) {
        const plate = source[(cursor + attempt) % source.length];
        const url = plate.image_url;

        if (usedInRow[rowIndex].has(url)) continue;
        if (rowIndex > 0 && usedInRow[rowIndex - 1].has(url)) continue;
        if (rows[rowIndex + 1]?.some((entry) => entry.image_url === url)) continue;

        rows[rowIndex].push(plate);
        usedInRow[rowIndex].add(url);
        cursor = (cursor + attempt + 1) % source.length;
        placed = true;
        placedAny = true;
        break;
      }

      // Prefer unique neighbors, but always fill tiles so images never go blank.
      if (!placed) {
        const plate = source[cursor % source.length];
        rows[rowIndex].push(plate);
        usedInRow[rowIndex].add(plate.image_url);
        cursor = (cursor + 1) % source.length;
        placedAny = true;
      }
    }

    if (!placedAny) break;
    if (rows.every((row) => row.length >= targetCount)) break;
  }

  return rows.map((row, index) => ({
    plates: shuffleRowDeterministic(row, index * 17 + 3),
    offsetPx: ROW_OFFSETS[index % ROW_OFFSETS.length] ?? index * 41,
    gapClass: ROW_GAPS[index % ROW_GAPS.length] ?? "gap-1.5",
    duration: ROW_DURATIONS[index % ROW_DURATIONS.length] ?? 60,
    reverse: index % 2 === 1,
  }));
}

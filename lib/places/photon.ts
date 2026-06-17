export interface PlaceSuggestion {
  name: string;
  detail?: string;
}

const FOOD_AMENITIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "food_court",
  "ice_cream",
  "biergarten",
  "food",
  "bbq",
]);

const FOOD_SHOPS = new Set(["bakery", "confectionery", "deli", "pastry"]);

interface PhotonFeature {
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

const EXCLUDED_OSM_VALUES = new Set(["construction", "disused"]);

function isFoodPlace(props: PhotonFeature["properties"]) {
  if (!props) return false;

  const key = props.osm_key ?? "";
  const value = props.osm_value ?? "";

  if (EXCLUDED_OSM_VALUES.has(value)) return false;
  if (key === "amenity" && FOOD_AMENITIES.has(value)) return true;
  if (key === "shop" && FOOD_SHOPS.has(value)) return true;

  return false;
}

function formatDetail(props: NonNullable<PhotonFeature["properties"]>) {
  const parts = [props.street, props.city, props.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

function suggestionKey(item: PlaceSuggestion) {
  return `${item.name.toLowerCase()}|${(item.detail ?? "").toLowerCase()}`;
}

export async function searchPhotonPlaces(
  query: string,
  location?: { lat: number; lng: number },
  limit = 6
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const params = new URLSearchParams({
    q,
    limit: String(Math.min(limit * 3, 20)),
    lang: "en",
  });

  if (location) {
    params.set("lat", String(location.lat));
    params.set("lon", String(location.lng));
  }

  try {
    const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];

    for (const feature of data.features ?? []) {
      const props = feature.properties;
      if (!props?.name?.trim() || !isFoodPlace(props)) continue;

      const name = props.name.trim().slice(0, 80);
      const detail = formatDetail(props)?.slice(0, 120);
      const item = { name, detail };
      const key = suggestionKey(item);

      if (seen.has(key)) continue;
      seen.add(key);

      results.push(item);
      if (results.length >= limit) break;
    }

    return results;
  } catch {
    return [];
  }
}

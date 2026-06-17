import { searchPhotonPlaces } from "@/lib/places/photon";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchUSRestaurants } from "@/lib/us-restaurants";

export interface RestaurantSuggestion {
  name: string;
  detail?: string;
}

function suggestionKey(item: RestaurantSuggestion) {
  return `${item.name.toLowerCase()}|${(item.detail ?? "").toLowerCase()}`;
}

function mergeSuggestions(lists: RestaurantSuggestion[][], limit = 8): RestaurantSuggestion[] {
  const seen = new Set<string>();
  const merged: RestaurantSuggestion[] = [];

  for (const list of lists) {
    for (const item of list) {
      const name = item.name.trim();
      if (!name) continue;

      const key = suggestionKey({ name, detail: item.detail });
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ name, detail: item.detail });
      if (merged.length >= limit) return merged;
    }
  }

  return merged;
}

async function searchCommunityRestaurants(query: string, limit = 4): Promise<RestaurantSuggestion[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("plates")
      .select("restaurant_name")
      .ilike("restaurant_name", `%${query}%`)
      .not("restaurant_name", "is", null)
      .limit(80);

    const counts = new Map<string, number>();

    for (const row of data ?? []) {
      const name = row.restaurant_name?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const q = query.toLowerCase();

    return Array.from(counts.entries())
      .sort((a, b) => {
        const aStarts = a[0].toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b[0].toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .slice(0, limit)
      .map(([name, count]) => ({
        name,
        detail: count > 1 ? `${count} plates on PlateCheck` : "Posted on PlateCheck",
      }));
  } catch {
    return [];
  }
}

function searchChainRestaurants(query: string, limit = 4): RestaurantSuggestion[] {
  return searchUSRestaurants(query, limit).map((name) => ({
    name,
    detail: "Popular chain",
  }));
}

export async function searchRestaurants(
  query: string,
  location?: { lat: number; lng: number }
): Promise<RestaurantSuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const [places, community, chains] = await Promise.all([
    searchPhotonPlaces(q, location, 6),
    searchCommunityRestaurants(q, 4),
    Promise.resolve(searchChainRestaurants(q, 4)),
  ]);

  return mergeSuggestions([places, community, chains], 8);
}

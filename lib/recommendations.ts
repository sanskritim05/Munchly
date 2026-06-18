import Groq from "groq-sdk";
import { getSignatureDish, isGenericDishName } from "@/lib/signature-dishes";
import { getUSRestaurants } from "@/lib/us-restaurants";

export const RECOMMENDATION_COUNT = 3;

export interface PlateHistoryItem {
  restaurant_name: string;
  dish_name: string;
  score: number;
}

export interface FoodRecommendation {
  restaurant: string;
  dish: string;
  reason: string;
}

export interface RecommendationResult {
  mode: "nearby" | "taste";
  taste_summary: string;
  location_label: string | null;
  recommendations: FoodRecommendation[];
}

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}

function cleanText(text: string) {
  return text.replace(/[—–]/g, "-").trim();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function resolveDishName(restaurant: string, dish: string) {
  const cleaned = cleanText(dish);
  if (!cleaned || isGenericDishName(cleaned)) {
    return getSignatureDish(restaurant);
  }
  return cleaned;
}

function buildAvoidLists(history: PlateHistoryItem[]) {
  const dishes = Array.from(new Set(history.map((h) => h.dish_name.trim()).filter(Boolean)));
  const restaurants = Array.from(
    new Set(history.map((h) => h.restaurant_name.trim()).filter(Boolean))
  );
  return { dishes, restaurants };
}

function sanitizeRecommendations(
  recs: FoodRecommendation[],
  history: PlateHistoryItem[],
  limit = RECOMMENDATION_COUNT
): FoodRecommendation[] {
  const pastDishes = new Set(history.map((h) => normalizeKey(h.dish_name)));
  const pastRestaurants = new Set(history.map((h) => normalizeKey(h.restaurant_name)));
  const seenRestaurants = new Set<string>();
  const seenDishes = new Set<string>();
  const cleaned: FoodRecommendation[] = [];

  for (const rec of recs) {
    const restaurant = cleanText(rec.restaurant);
    const dish = resolveDishName(restaurant, rec.dish);
    const reason = cleanText(rec.reason);

    if (!restaurant || !dish) continue;

    const restaurantKey = normalizeKey(restaurant);
    const dishKey = normalizeKey(dish);

    if (pastDishes.has(dishKey)) continue;
    if (pastRestaurants.has(restaurantKey)) continue;
    if (seenRestaurants.has(restaurantKey)) continue;
    if (seenDishes.has(dishKey)) continue;

    seenRestaurants.add(restaurantKey);
    seenDishes.add(dishKey);
    cleaned.push({ restaurant, dish, reason: reason || "A new pick based on your taste." });

    if (cleaned.length >= limit) break;
  }

  return cleaned;
}

function fallbackRecommendations(
  history: PlateHistoryItem[],
  locationLabel: string | null
): RecommendationResult {
  const visited = new Set(history.map((h) => normalizeKey(h.restaurant_name)));
  const pastDishes = new Set(history.map((h) => normalizeKey(h.dish_name)));
  const candidates = getUSRestaurants().filter((r) => !visited.has(normalizeKey(r)));

  const topDishes = history
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((h) => h.dish_name);

  const taste_summary =
    history.length > 0
      ? `You seem to like ${topDishes.slice(0, 2).join(" and ")}. Here are new spots to try.`
      : "Post plates to build your taste profile.";

  const recommendations: FoodRecommendation[] = [];

  for (const restaurant of candidates) {
    const dish = getSignatureDish(restaurant);
    if (pastDishes.has(normalizeKey(dish))) continue;

    recommendations.push({
      restaurant,
      dish,
      reason: locationLabel
        ? `Popular near ${locationLabel} and different from what you've posted.`
        : "A well-known pick that fits your taste profile.",
    });

    if (recommendations.length >= RECOMMENDATION_COUNT) break;
  }

  return {
    mode: locationLabel ? "nearby" : "taste",
    taste_summary,
    location_label: locationLabel,
    recommendations,
  };
}

function fillMissingRecommendations(
  current: FoodRecommendation[],
  history: PlateHistoryItem[],
  locationLabel: string | null
): FoodRecommendation[] {
  if (current.length >= RECOMMENDATION_COUNT) {
    return current.slice(0, RECOMMENDATION_COUNT);
  }

  const fallback = fallbackRecommendations(history, locationLabel).recommendations;
  const merged = sanitizeRecommendations([...current, ...fallback], history, RECOMMENDATION_COUNT);

  return merged.slice(0, RECOMMENDATION_COUNT);
}

export async function getFoodRecommendations(
  history: PlateHistoryItem[],
  locationLabel: string | null
): Promise<RecommendationResult> {
  if (history.length === 0) {
    return {
      mode: locationLabel ? "nearby" : "taste",
      taste_summary: "Post a few plates to unlock personalized picks.",
      location_label: locationLabel,
      recommendations: [],
    };
  }

  if (!process.env.GROQ_API_KEY) {
    return fallbackRecommendations(history, locationLabel);
  }

  const { dishes: avoidDishes, restaurants: avoidRestaurants } = buildAvoidLists(history);

  const historyText = history
    .map(
      (h) =>
        `- ${h.dish_name} at ${h.restaurant_name} (score ${h.score.toFixed(1)})`
    )
    .join("\n");

  const mode = locationLabel ? "nearby" : "taste";
  const locationContext = locationLabel
    ? `The user is near ${locationLabel}. Prioritize restaurants likely available in that area.`
    : "No location shared. Recommend real US restaurant chains or widely known restaurants.";

  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.75,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content: `You are a food recommendation assistant for PlateCheck.
Return ONLY valid JSON, no markdown:
{
  "taste_summary": string (one short sentence about their taste, not listing their past orders),
  "recommendations": [
    { "restaurant": string, "dish": string, "reason": string (max 14 words) }
  ]
}

Rules:
- Give exactly ${RECOMMENDATION_COUNT} recommendations
- Each recommendation MUST include both a restaurant and a specific menu item to order there
- Recommend NEW restaurants the user has NOT visited before
- Recommend NEW dishes the user has NOT posted before
- Never repeat or lightly reword dishes from their history
- Pick a real, specific menu item at each restaurant (e.g. "Orange Chicken", not "house special")
- Never use generic dish names like "signature entree", "house special", or "chef's pick"
- Use real US restaurant chains or widely known restaurant names
- All ${RECOMMENDATION_COUNT} picks must be different restaurants and different dishes
- Plain English, no emojis, no em dashes
- Reasons should explain why this new pick fits their taste, not restate what they already ate`,
        },
        {
          role: "user",
          content: `Mode: ${mode}
${locationContext}

Their plate history (for taste profile only — do NOT recommend these again):
${historyText}

Dishes they already ordered (never recommend these):
${avoidDishes.join(", ") || "none"}

Restaurants they already visited (never recommend these):
${avoidRestaurants.join(", ") || "none"}

Suggest ${RECOMMENDATION_COUNT} new restaurants and one specific dish to try at each.`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackRecommendations(history, locationLabel);

    const parsed = JSON.parse(jsonMatch[0]) as {
      taste_summary?: string;
      recommendations?: FoodRecommendation[];
    };

    const raw = (parsed.recommendations ?? []).map((r) => ({
      restaurant: cleanText(r.restaurant || ""),
      dish: cleanText(r.dish || ""),
      reason: cleanText(r.reason || ""),
    }));

    const recommendations = fillMissingRecommendations(
      sanitizeRecommendations(raw, history),
      history,
      locationLabel
    );

    if (recommendations.length === 0) {
      return fallbackRecommendations(history, locationLabel);
    }

    return {
      mode,
      taste_summary: cleanText(
        parsed.taste_summary || "New picks based on flavors you seem to enjoy."
      ),
      location_label: locationLabel,
      recommendations,
    };
  } catch {
    return fallbackRecommendations(history, locationLabel);
  }
}

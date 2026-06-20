import {
  createGroqClient,
  GROQ_TASTE_PICKS_MODEL,
  hasGroqKey,
} from "@/lib/groq-config";
import {
  buildDishReason,
  buildTasteSummaryFromHistory,
  getPickStyleKey,
  scorePickForHistory,
  shouldRecommendPick,
} from "@/lib/recommendation-reasons";
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

export interface RecommendationOptions {
  refresh?: boolean;
  excludeRestaurants?: string[];
  excludeDishes?: string[];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

function buildTasteSummary(history: PlateHistoryItem[]) {
  return buildTasteSummaryFromHistory(history);
}

function sanitizeTasteSummary(_summary: string | undefined, history: PlateHistoryItem[]) {
  return buildTasteSummary(history);
}

function buildAvoidLists(history: PlateHistoryItem[]) {
  const dishes = Array.from(new Set(history.map((h) => h.dish_name.trim()).filter(Boolean)));
  const restaurants = Array.from(
    new Set(history.map((h) => h.restaurant_name.trim()).filter(Boolean))
  );
  return { dishes, restaurants };
}

function orderRestaurantsForHistory(
  restaurants: string[],
  history: PlateHistoryItem[],
  refresh?: boolean
) {
  const scored = restaurants.map((restaurant) => ({
    restaurant,
    score: scorePickForHistory(history, getSignatureDish(restaurant), restaurant),
  }));

  scored.sort((a, b) => b.score - a.score);

  if (!refresh) {
    return scored.map((item) => item.restaurant);
  }

  const strong = scored.filter((item) => item.score >= 20);
  const weak = scored.filter((item) => item.score < 20);
  return [...shuffle(strong), ...shuffle(weak)].map((item) => item.restaurant);
}

function sanitizeRecommendations(
  recs: FoodRecommendation[],
  history: PlateHistoryItem[],
  locationLabel: string | null,
  limit = RECOMMENDATION_COUNT,
  extraExclude?: { restaurants: Set<string>; dishes: Set<string> }
): FoodRecommendation[] {
  const pastDishes = new Set(history.map((h) => normalizeKey(h.dish_name)));
  const pastRestaurants = new Set(history.map((h) => normalizeKey(h.restaurant_name)));
  const seenRestaurants = new Set<string>();
  const seenDishes = new Set<string>();
  const usedReasons = new Set<string>();
  const usedAnchors = new Set<string>();
  const cleaned: FoodRecommendation[] = [];
  let pickIndex = 0;

  const ranked = [...recs].sort((a, b) => {
    const restaurantA = cleanText(a.restaurant);
    const restaurantB = cleanText(b.restaurant);
    const dishA = resolveDishName(restaurantA, cleanText(a.dish));
    const dishB = resolveDishName(restaurantB, cleanText(b.dish));
    return (
      scorePickForHistory(history, dishB, restaurantB) -
      scorePickForHistory(history, dishA, restaurantA)
    );
  });

  for (const rec of ranked) {
    const restaurant = cleanText(rec.restaurant);
    const dish = resolveDishName(restaurant, rec.dish);

    if (!restaurant || !dish) continue;

    const restaurantKey = normalizeKey(restaurant);
    const dishKey = normalizeKey(dish);

    if (pastDishes.has(dishKey)) continue;
    if (pastRestaurants.has(restaurantKey)) continue;
    if (extraExclude?.restaurants.has(restaurantKey)) continue;
    if (extraExclude?.dishes.has(dishKey)) continue;
    if (seenRestaurants.has(restaurantKey)) continue;
    if (seenDishes.has(dishKey)) continue;
    if (!shouldRecommendPick(history, dish, restaurant)) continue;

    seenRestaurants.add(restaurantKey);
    seenDishes.add(dishKey);
    cleaned.push({
      restaurant,
      dish,
      reason: buildDishReason(dish, restaurant, history, locationLabel, {
        pickIndex,
        usedReasons,
        usedAnchors,
      }),
    });
    pickIndex += 1;

    if (cleaned.length >= limit) break;
  }

  return cleaned;
}

function fallbackRecommendations(
  history: PlateHistoryItem[],
  locationLabel: string | null,
  options?: RecommendationOptions
): RecommendationResult {
  const visited = new Set(history.map((h) => normalizeKey(h.restaurant_name)));
  const pastDishes = new Set(history.map((h) => normalizeKey(h.dish_name)));
  const extraExclude = buildExtraExclude(options);
  const candidates = orderRestaurantsForHistory(
    getUSRestaurants().filter((r) => !visited.has(normalizeKey(r))),
    history,
    options?.refresh
  );

  const taste_summary = buildTasteSummary(history);

  const pool: {
    restaurant: string;
    dish: string;
    score: number;
    styleKey: string;
  }[] = [];

  for (const restaurant of candidates) {
    const restaurantKey = normalizeKey(restaurant);
    if (extraExclude.restaurants.has(restaurantKey)) continue;

    const dish = getSignatureDish(restaurant);
    const dishKey = normalizeKey(dish);
    if (pastDishes.has(dishKey)) continue;
    if (extraExclude.dishes.has(dishKey)) continue;
    if (!shouldRecommendPick(history, dish, restaurant)) continue;

    pool.push({
      restaurant,
      dish,
      score: scorePickForHistory(history, dish, restaurant),
      styleKey: getPickStyleKey(dish, restaurant),
    });
  }

  pool.sort((a, b) => b.score - a.score);

  const recommendations: FoodRecommendation[] = [];
  const usedReasons = new Set<string>();
  const usedAnchors = new Set<string>();
  const usedStyles = new Set<string>();
  const usedRestaurantKeys = new Set<string>();
  let pickIndex = 0;

  function addPick(entry: (typeof pool)[number]) {
    const restaurantKey = normalizeKey(entry.restaurant);
    if (usedRestaurantKeys.has(restaurantKey)) return false;

    recommendations.push({
      restaurant: entry.restaurant,
      dish: entry.dish,
      reason: buildDishReason(entry.dish, entry.restaurant, history, locationLabel, {
        pickIndex,
        usedReasons,
        usedAnchors,
      }),
    });
    usedRestaurantKeys.add(restaurantKey);
    usedStyles.add(entry.styleKey);
    pickIndex += 1;
    return true;
  }

  for (const entry of pool) {
    if (recommendations.length >= RECOMMENDATION_COUNT) break;
    if (usedStyles.has(entry.styleKey) && usedStyles.size < RECOMMENDATION_COUNT) continue;
    addPick(entry);
  }

  for (const entry of pool) {
    if (recommendations.length >= RECOMMENDATION_COUNT) break;
    addPick(entry);
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
  locationLabel: string | null,
  options?: RecommendationOptions
): FoodRecommendation[] {
  if (current.length >= RECOMMENDATION_COUNT) {
    return current.slice(0, RECOMMENDATION_COUNT);
  }

  const extraExclude = buildExtraExclude(options);
  const fallback = fallbackRecommendations(history, locationLabel, options).recommendations;
  const merged = sanitizeRecommendations(
    [...current, ...fallback],
    history,
    locationLabel,
    RECOMMENDATION_COUNT,
    extraExclude
  );

  return merged.slice(0, RECOMMENDATION_COUNT);
}

function buildExtraExclude(options?: RecommendationOptions) {
  return {
    restaurants: new Set((options?.excludeRestaurants ?? []).map(normalizeKey)),
    dishes: new Set((options?.excludeDishes ?? []).map(normalizeKey)),
  };
}

export async function getFoodRecommendations(
  history: PlateHistoryItem[],
  locationLabel: string | null,
  options?: RecommendationOptions
): Promise<RecommendationResult> {
  if (history.length === 0) {
    return {
      mode: locationLabel ? "nearby" : "taste",
      taste_summary: "Post a few plates to unlock personalized picks.",
      location_label: locationLabel,
      recommendations: [],
    };
  }

  if (!hasGroqKey()) {
    return fallbackRecommendations(history, locationLabel, options);
  }

  const { dishes: avoidDishes, restaurants: avoidRestaurants } = buildAvoidLists(history);
  const extraExclude = buildExtraExclude(options);
  const refreshContext = options?.refresh
    ? `
The user tapped refresh and wants completely different picks.
Do NOT recommend any of these recently shown restaurants: ${
        options.excludeRestaurants?.join(", ") || "none"
      }
Do NOT recommend any of these recently shown dishes: ${options.excludeDishes?.join(", ") || "none"}`
    : "";

  const historyText = history
    .map((h) => `- ${h.dish_name} at ${h.restaurant_name} (posted by user)`)
    .join("\n");

  const mode = locationLabel ? "nearby" : "taste";
  const locationContext = locationLabel
    ? `The user is near ${locationLabel}. Prioritize restaurants likely available in that area.`
    : "No location shared. Recommend real US restaurant chains or widely known restaurants.";

  try {
    const response = await createGroqClient().chat.completions.create({
      model: GROQ_TASTE_PICKS_MODEL,
      temperature: options?.refresh ? 0.95 : 0.75,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content: `You are a food recommendation assistant for PlateCheck.
Return ONLY valid JSON, no markdown:
{
  "taste_summary": string (optional, leave empty),
  "recommendations": [
    { "restaurant": string, "dish": string }
  ]
}

Rules:
- Give exactly ${RECOMMENDATION_COUNT} recommendations with varied cuisines and styles across the three picks
- Do not make all three picks revolve around one trait like creamy, pasta, or chicken unless the user's history is extremely narrow
- Look at the user's full posting history holistically, not just their latest dish or one repeated trait
- Leave taste_summary as an empty string
- Each recommendation MUST include both a restaurant and a specific menu item to order there
- Recommend NEW restaurants the user has NOT visited before
- Recommend NEW dishes the user has NOT posted before
- Never repeat or lightly reword dishes from their history
- Pick a real, specific menu item at each restaurant (e.g. "Orange Chicken", not "house special")
- Never use generic dish names like "signature entree", "house special", or "chef's pick"
- Use real US restaurant chains or widely known restaurant names
- All ${RECOMMENDATION_COUNT} picks must be different restaurants and different dishes
- Match the course and style of what they post. If they post desserts like donuts, pick bakeries, ice cream, or sweet menu items, not savory bowls or chicken entrees
- Do not recommend a savory bowl or entree for a dessert post unless it is a deliberate savory stretch`,
        },
        {
          role: "user",
          content: `Mode: ${mode}
${locationContext}
${refreshContext}

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
    if (!jsonMatch) return fallbackRecommendations(history, locationLabel, options);

    const parsed = JSON.parse(jsonMatch[0]) as {
      taste_summary?: string;
      recommendations?: FoodRecommendation[];
    };

    const raw = (parsed.recommendations ?? []).map((r) => ({
      restaurant: cleanText(r.restaurant || ""),
      dish: cleanText(r.dish || ""),
      reason: "",
    }));

    const recommendations = fillMissingRecommendations(
      sanitizeRecommendations(raw, history, locationLabel, RECOMMENDATION_COUNT, extraExclude),
      history,
      locationLabel,
      options
    );

    if (recommendations.length === 0) {
      return fallbackRecommendations(history, locationLabel, options);
    }

    const allWeak = recommendations.every(
      (rec) => scorePickForHistory(history, rec.dish, rec.restaurant) <= 0
    );
    if (allWeak) {
      return fallbackRecommendations(history, locationLabel, options);
    }

    return {
      mode,
      taste_summary: sanitizeTasteSummary(parsed.taste_summary, history),
      location_label: locationLabel,
      recommendations,
    };
  } catch {
    return fallbackRecommendations(history, locationLabel, options);
  }
}

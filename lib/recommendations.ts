import Groq from "groq-sdk";
import { getUSRestaurants } from "@/lib/us-restaurants";

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

function fallbackRecommendations(
  history: PlateHistoryItem[],
  locationLabel: string | null
): RecommendationResult {
  const visited = new Set(history.map((h) => h.restaurant_name.toLowerCase()));
  const candidates = getUSRestaurants().filter((r) => !visited.has(r.toLowerCase()));
  const topDishes = history
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((h) => h.dish_name);

  const taste_summary =
    history.length > 0
      ? `You often post ${topDishes.join(", ")}.`
      : "Post plates to build your taste profile.";

  const recommendations: FoodRecommendation[] = candidates.slice(0, 4).map((restaurant, i) => ({
    restaurant,
    dish: topDishes[i % topDishes.length] ?? "Chef's pick",
    reason: locationLabel
      ? `Popular spot to try near ${locationLabel}.`
      : "Matches restaurants and flavors you already like.",
  }));

  return {
    mode: locationLabel ? "nearby" : "taste",
    taste_summary,
    location_label: locationLabel,
    recommendations,
  };
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

  const historyText = history
    .map(
      (h) =>
        `- ${h.dish_name} at ${h.restaurant_name} (score ${h.score.toFixed(1)})`
    )
    .join("\n");

  const mode = locationLabel ? "nearby" : "taste";
  const locationContext = locationLabel
    ? `The user is near ${locationLabel}. Prioritize restaurants likely available in that area.`
    : "No location shared. Recommend US restaurants that fit their taste from chains and well-known brands.";

  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are a food recommendation assistant for PlateCheck.
Return ONLY valid JSON, no markdown:
{
  "taste_summary": string (one short sentence about their taste),
  "recommendations": [
    { "restaurant": string, "dish": string, "reason": string (max 14 words) }
  ]
}

Rules:
- Give exactly 4 recommendations
- Use real US restaurant chains or widely known restaurant names
- Base picks on their posting history (dishes and restaurants)
- Plain English, no emojis, no em dashes
- Each reason must be specific to their history or location`,
        },
        {
          role: "user",
          content: `Mode: ${mode}
${locationContext}

Their plate history:
${historyText}

Suggest restaurants and specific dishes to try next.`,
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

    const recommendations = (parsed.recommendations ?? [])
      .slice(0, 4)
      .map((r) => ({
        restaurant: cleanText(r.restaurant || "Local favorite"),
        dish: cleanText(r.dish || "House special"),
        reason: cleanText(r.reason || "Based on your taste."),
      }));

    if (recommendations.length === 0) {
      return fallbackRecommendations(history, locationLabel);
    }

    return {
      mode,
      taste_summary: cleanText(parsed.taste_summary || "Picks based on what you post."),
      location_label: locationLabel,
      recommendations,
    };
  } catch {
    return fallbackRecommendations(history, locationLabel);
  }
}

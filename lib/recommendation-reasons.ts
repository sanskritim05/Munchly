import type { PlateHistoryItem } from "@/lib/recommendations";

const GENERIC_REASON_PATTERNS = [
  /^a well-known pick/i,
  /^a new pick based on your taste/i,
  /^popular near/i,
  /fits your taste profile/i,
  /different from what you'?ve posted/i,
];

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function fitWordCount(text: string, min = 10, max = 11) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > max) return words.slice(0, max).join(" ");
  if (words.length < min) {
    const padding = ["for", "your", "taste", "profile"];
    while (words.length < min && padding.length > 0) {
      words.push(padding.shift()!);
    }
  }
  return words.join(" ");
}

export function isGenericReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return true;
  return GENERIC_REASON_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function shortenLabel(value: string, maxWords = 2) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, maxWords).join(" ");
}

function tasteHint(history: PlateHistoryItem[]) {
  const text = history
    .map((item) => `${item.dish_name} ${item.restaurant_name}`.toLowerCase())
    .join(" ");

  if (/taco|burrito|quesadilla|salsa|chipotle|moe'?s/.test(text)) return "Tex-Mex";
  if (/sushi|ramen|teriyaki|orange chicken|mongolian|pho|pad thai/.test(text)) return "Asian";
  if (/pizza|pasta|italian|lasagna|parmesan/.test(text)) return "Italian";
  if (/burger|fries|bbq|wings|steak|smashburger/.test(text)) return "savory comfort";
  if (/salad|bowl|harvest|greens|sweetgreen|cava/.test(text)) return "fresh bowl";
  if (/chicken|sandwich|spicy|crispy/.test(text)) return "chicken";
  return "go-to";
}

export function buildDishReason(
  dish: string,
  history: PlateHistoryItem[],
  locationLabel: string | null
) {
  const top = [...history].sort((a, b) => b.score - a.score);
  const favorite = shortenLabel(top[0]?.dish_name ?? "your favorites", 2);
  const dishLabel = shortenLabel(dish, 2);
  const hint = tasteHint(history);
  const location = locationLabel?.split(",")[0]?.trim();

  const candidates = [
    `You loved ${favorite}, so ${dishLabel} should hit the same flavor notes.`,
    `Your ${hint} favorites suggest ${dishLabel} matches the flavors you crave most.`,
    `Because you rated ${favorite} highly, ${dishLabel} should feel familiar yet fresh.`,
    `Your top plates point to ${dishLabel} as a smart next order for you.`,
  ];

  if (location) {
    candidates.unshift(
      `Near ${location}, ${dishLabel} is a strong pick for your ${hint} taste.`
    );
  }

  const matched = candidates.find((reason) => {
    const count = wordCount(reason);
    return count >= 10 && count <= 11;
  });

  return fitWordCount(matched ?? candidates[0], 10, 11);
}

export function resolveDishReason(
  reason: string,
  dish: string,
  history: PlateHistoryItem[],
  locationLabel: string | null
) {
  const cleaned = reason.trim();
  const count = wordCount(cleaned);

  if (!isGenericReason(cleaned) && count >= 10 && count <= 11) {
    return cleaned;
  }

  return buildDishReason(dish, history, locationLabel);
}

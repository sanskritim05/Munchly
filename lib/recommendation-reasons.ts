import type { PlateHistoryItem } from "@/lib/recommendations";

const GENERIC_REASON_PATTERNS = [
  /^a well-known pick/i,
  /^a new pick based on your taste/i,
  /^popular near/i,
  /fits your taste profile/i,
  /different from what you'?ve posted/i,
  /should hit the same/i,
  /flavor notes/i,
  /feel familiar/i,
  /smart next order/i,
  /crave most/i,
  /matches the flavors you/i,
  /natural next/i,
  /strong pick for your/i,
];

const TRAIT_PATTERNS: { trait: string; pattern: RegExp }[] = [
  { trait: "kabob", pattern: /\b(kabob|kebab|skewer|shawarma|gyro|tikka|tandoori)\b/i },
  { trait: "spicy", pattern: /\b(spicy|hot|jalape|buffalo|peri|cajun|sriracha|habanero|chipotle|chili)\b/i },
  { trait: "smoky", pattern: /\b(smoky|smoke|bbq|barbecue|grilled|charred|bourbon|ribeye|steak)\b/i },
  { trait: "creamy", pattern: /\b(creamy|alfredo|cheese|queso|mac and cheese|butter|custard|carbonara)\b/i },
  { trait: "tangy", pattern: /\b(tangy|yogurt|lemon|citrus|vinegar|tomato|salsa|pickle)\b/i },
  { trait: "crispy", pattern: /\b(crispy|crunchy|fried|crisp|tenders|nuggets|wings)\b/i },
  { trait: "sweet", pattern: /\b(sweet|honey|caramel|maple|glazed|brown sugar|teriyaki)\b/i },
  { trait: "bowl", pattern: /\b(bowl|burrito bowl|harvest|greens|grain)\b/i },
  { trait: "pasta", pattern: /\b(pasta|spaghetti|lasagna|noodle|ramen|fettuccine)\b/i },
  { trait: "pizza", pattern: /\b(pizza|pepperoni|calzone)\b/i },
  { trait: "seafood", pattern: /\b(fish|shrimp|salmon|tuna|crab|lobster|sushi|poke)\b/i },
  { trait: "chicken", pattern: /\b(chicken|poultry|wings)\b/i },
  { trait: "beef", pattern: /\b(beef|burger|steak|brisket|roast beef|ribeye|sirloin)\b/i },
  { trait: "breakfast", pattern: /\b(pancake|waffle|breakfast|eggs|biscuit|omelet)\b/i },
];

const TRAIT_PRIORITY = [
  "kabob",
  "spicy",
  "smoky",
  "creamy",
  "crispy",
  "seafood",
  "pasta",
  "pizza",
  "bowl",
  "chicken",
  "beef",
  "tangy",
  "sweet",
  "breakfast",
];

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function fitWordCount(text: string, min = 10, max = 11) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > max) return words.slice(0, max).join(" ");
  if (words.length < min) {
    const padding = ["for", "you", "to", "try"];
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

function dishShort(name: string, maxWords = 3) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function extractTraits(...parts: (string | null | undefined)[]) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const traits = new Set<string>();

  for (const { trait, pattern } of TRAIT_PATTERNS) {
    if (pattern.test(text)) traits.add(trait);
  }

  return traits;
}

function anchorPrimary(traits: Set<string>) {
  return TRAIT_PRIORITY.find((trait) => traits.has(trait)) ?? null;
}

const BRIDGE_REASONS: Record<
  string,
  Record<string, (anchorDish: string, dish: string) => string>
> = {
  kabob: {
    beef: (anchor, dish) =>
      `Your kabobs like ${dishShort(anchor, 2)} show bold meat love; ${dishShort(dish)} fits.`,
    smoky: (anchor, dish) =>
      `Spiced kabobs you rated high point to ${dishShort(dish)}'s charred savory depth.`,
  },
  tangy: {
    beef: (anchor, dish) =>
      `Tangy plates like ${dishShort(anchor, 2)} suggest ${dishShort(dish)}'s rich beef savor.`,
    smoky: (anchor, dish) =>
      `Bright marinated flavors you enjoy suit ${dishShort(dish)}'s bold blackened crust.`,
  },
  spicy: {
    creamy: (anchor, dish) =>
      `Your spicy favorites like ${dishShort(anchor, 2)} pair well with ${dishShort(dish)}'s rich heat.`,
    smoky: (anchor, dish) =>
      `Heat lovers like you who enjoyed ${dishShort(anchor, 2)} should try ${dishShort(dish)}.`,
  },
  creamy: {
    pasta: (anchor, dish) =>
      `Creamy comfort you loved in ${dishShort(anchor, 2)} makes ${dishShort(dish)} an easy yes.`,
  },
  bowl: {
    chicken: (anchor, dish) =>
      `Fresh bowls you posted often mean ${dishShort(dish)}'s lean protein should click.`,
  },
};

export function buildDishReason(
  dish: string,
  restaurant: string,
  history: PlateHistoryItem[],
  locationLabel: string | null
) {
  const top = [...history].sort((a, b) => b.score - a.score);
  const anchor = top[0];
  const anchorDish = anchor?.dish_name ?? "your favorites";
  const anchorRestaurant = anchor?.restaurant_name ?? "";

  const anchorTraits = extractTraits(anchorDish, anchorRestaurant);
  const dishTraits = extractTraits(dish, restaurant);
  const sharedTrait = TRAIT_PRIORITY.find(
    (trait) => anchorTraits.has(trait) && dishTraits.has(trait)
  );

  const location = locationLabel?.split(",")[0]?.trim();
  let reason: string;

  if (sharedTrait) {
    reason = reasonForTrait(sharedTrait, dish, restaurant, anchorDish);
  } else {
    const fromAnchor = anchorPrimary(anchorTraits);
    const fromDish = anchorPrimary(dishTraits);
    const bridge = fromAnchor && fromDish ? BRIDGE_REASONS[fromAnchor]?.[fromDish] : undefined;

    if (bridge) {
      reason = bridge(anchorDish, dish);
    } else if (fromAnchor) {
      reason = reasonForTrait(fromAnchor, dish, restaurant, anchorDish);
    } else if (fromDish) {
      reason = reasonForTrait(fromDish, dish, restaurant, anchorDish);
    } else {
      reason = `High scores on ${dishShort(anchorDish, 2)} suggest ${dishShort(dish)} at ${dishShort(restaurant, 2)} fits you.`;
    }
  }

  if (location && sharedTrait) {
    const localVariant = `Near ${location}, ${dishShort(dish)} matches your taste for ${sharedTrait} comfort food.`;
    if (wordCount(localVariant) >= 10 && wordCount(localVariant) <= 11) {
      reason = localVariant;
    }
  }

  return fitWordCount(reason, 10, 11);
}

function reasonForTrait(
  trait: string,
  dish: string,
  restaurant: string,
  anchorDish: string
) {
  const dishLabel = dishShort(dish);
  const anchorLabel = dishShort(anchorDish, 2);

  switch (trait) {
    case "kabob":
      return `Your spiced grilled kabobs like ${anchorLabel} point toward ${dishLabel}'s seasoned char.`;
    case "spicy":
      return `You rate spicy heat highly on ${anchorLabel}, so ${dishLabel}'s kick should land well.`;
    case "smoky":
      return `Your love for smoky grilled plates suggests ${dishLabel}'s charred depth will appeal.`;
    case "creamy":
      return `Creamy comfort picks like ${anchorLabel} show ${dishLabel} has the richness you want.`;
    case "tangy":
      return `Bright tangy flavors in ${anchorLabel} suggest ${dishLabel} will match your palate nicely.`;
    case "crispy":
      return `You score crispy fried plates high, so ${dishLabel}'s crunch should be your style.`;
    case "sweet":
      return `Your sweeter favorites like ${anchorLabel} hint ${dishLabel}'s glaze will click for you.`;
    case "bowl":
      return `Fresh balanced bowls you loved imply ${dishLabel} has the build you usually enjoy.`;
    case "pasta":
      return `Pasta comfort you rated highly makes ${dishLabel} a natural carb-rich follow-up pick.`;
    case "pizza":
      return `Your high pizza scores mean ${dishLabel}'s cheesy savory profile should satisfy you.`;
    case "seafood":
      return `Seafood plates you enjoyed suggest ${dishLabel} brings the ocean flavor you like.`;
    case "chicken":
      return `Chicken dishes like ${anchorLabel} you rated high make ${dishLabel} an easy fit.`;
    case "beef":
      return `Hearty beef mains you loved suggest ${dishLabel}'s savory protein is your lane.`;
    case "breakfast":
      return `Your breakfast favorites like ${anchorLabel} show ${dishLabel} suits your morning cravings.`;
    default:
      return `High scores on ${dishShort(anchorDish, 2)} suggest ${dishLabel} at ${dishShort(restaurant, 2)} fits your taste.`;
  }
}

export function resolveDishReason(
  reason: string,
  restaurant: string,
  dish: string,
  history: PlateHistoryItem[],
  locationLabel: string | null
) {
  const cleaned = reason.trim();
  const count = wordCount(cleaned);

  if (!isGenericReason(cleaned) && count >= 10 && count <= 11) {
    return cleaned;
  }

  return buildDishReason(dish, restaurant, history, locationLabel);
}

import type { PlateHistoryItem } from "@/lib/recommendations";

export const RECOMMENDATION_REASON_MAX_WORDS = 15;
export const RECOMMENDATION_REASON_MIN_WORDS = 8;

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
  /matches your palate nicely/i,
  /natural next/i,
  /strong pick for your/i,
  /bright tangy flavors in/i,
];

const TRAIT_PATTERNS: { trait: string; pattern: RegExp }[] = [
  { trait: "kabob", pattern: /\b(kabob|kabab|kebab|skewer|shawarma|gyro|tikka|tandoori)\b/i },
  { trait: "spicy", pattern: /\b(spicy|hot|jalape|buffalo|peri|cajun|sriracha|habanero|chipotle|chili)\b/i },
  { trait: "smoky", pattern: /\b(smoky|smoke|bbq|barbecue|grilled|charred|bourbon|ribeye|steak)\b/i },
  { trait: "creamy", pattern: /\b(creamy|alfredo|cheese|queso|mac and cheese|butter|custard|carbonara)\b/i },
  { trait: "tangy", pattern: /\b(tangy|yogurt|lemon|citrus|vinegar|tomato|salsa|pickle|mojo)\b/i },
  { trait: "crispy", pattern: /\b(crispy|crunchy|fried|crisp|tenders|nuggets|wings|orange chicken)\b/i },
  { trait: "sweet", pattern: /\b(sweet|honey|caramel|maple|glazed|brown sugar|teriyaki|orange)\b/i },
  { trait: "bowl", pattern: /\b(bowl|burrito bowl|harvest|greens|grain|tropichop)\b/i },
  { trait: "pasta", pattern: /\b(pasta|spaghetti|lasagna|noodle|ramen|fettuccine)\b/i },
  { trait: "pizza", pattern: /\b(pizza|pepperoni|calzone)\b/i },
  { trait: "seafood", pattern: /\b(fish|shrimp|salmon|tuna|crab|lobster|sushi|poke)\b/i },
  { trait: "chicken", pattern: /\b(chicken|poultry|wings)\b/i },
  { trait: "beef", pattern: /\b(beef|burger|steak|brisket|roast beef|ribeye|sirloin|cheeseburger)\b/i },
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

type ReasonBuilder = (anchorDish: string, dish: string, restaurant: string) => string;

const TRAIT_REASON_VARIANTS: Record<string, ReasonBuilder[]> = {
  kabob: [
    (anchor, dish) =>
      `Your spiced grilled kabobs like ${dishShort(anchor, 2)} point toward ${dishShort(dish)}'s seasoned char.`,
    (anchor, dish) =>
      `You score skewered meats high, so ${dishShort(dish)}'s bold seasoning should feel familiar.`,
    (anchor, dish) =>
      `${dishShort(dish)} brings the same grilled spice energy you loved in ${dishShort(anchor, 2)}.`,
  ],
  spicy: [
    (anchor, dish) =>
      `You rate spicy heat highly on ${dishShort(anchor, 2)}, so ${dishShort(dish)}'s kick should land well.`,
    (anchor, dish) =>
      `Heat seekers like you who enjoyed ${dishShort(anchor, 2)} should like ${dishShort(dish)}'s punch.`,
    (anchor, dish) =>
      `${dishShort(dish)} has enough spice to match the fire you liked in ${dishShort(anchor, 2)}.`,
  ],
  smoky: [
    (anchor, dish) =>
      `Your love for smoky grilled plates suggests ${dishShort(dish)}'s charred depth will appeal.`,
    (anchor, dish) =>
      `Char and smoke fans like you should enjoy ${dishShort(dish)} after ${dishShort(anchor, 2)}.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s grilled savor lines up with how much you liked ${dishShort(anchor, 2)}.`,
  ],
  creamy: [
    (anchor, dish) =>
      `Creamy comfort picks like ${dishShort(anchor, 2)} show ${dishShort(dish)} has the richness you want.`,
    (anchor, dish) =>
      `You lean rich and creamy, so ${dishShort(dish)} should hit after ${dishShort(anchor, 2)}.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s lush texture fits the comfort you found in ${dishShort(anchor, 2)}.`,
  ],
  tangy: [
    (anchor, dish) =>
      `You loved the bright marinade in ${dishShort(anchor, 2)}, so ${dishShort(dish)}'s glaze should click.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s sweet-tangy balance mirrors what worked for you in ${dishShort(anchor, 2)}.`,
    (anchor, dish) =>
      `Your high score on ${dishShort(anchor, 2)} points to ${dishShort(dish)}'s citrusy punch.`,
  ],
  crispy: [
    (anchor, dish) =>
      `You score crispy fried plates high, so ${dishShort(dish)}'s crunch should be your style.`,
    (anchor, dish) =>
      `Fried comfort like ${dishShort(dish)} fits after you enjoyed ${dishShort(anchor, 2)}.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s crisp texture should satisfy the same craving as ${dishShort(anchor, 2)}.`,
  ],
  sweet: [
    (anchor, dish) =>
      `Your sweeter favorites like ${dishShort(anchor, 2)} hint ${dishShort(dish)}'s glaze will click for you.`,
    (anchor, dish) =>
      `You clearly like sweet-savory plates, so ${dishShort(dish)} should be an easy win.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s sweetness lines up with what you enjoyed in ${dishShort(anchor, 2)}.`,
  ],
  bowl: [
    (anchor, dish) =>
      `Fresh balanced bowls you loved imply ${dishShort(dish)} has the build you usually enjoy.`,
    (anchor, dish) =>
      `You post balanced bowls often, so ${dishShort(dish)}'s mix should feel right.`,
    (anchor, dish) =>
      `${dishShort(dish)} has the layered bowl energy you liked in ${dishShort(anchor, 2)}.`,
  ],
  pasta: [
    (anchor, dish) =>
      `Pasta comfort you rated highly makes ${dishShort(dish)} a natural carb-rich follow-up pick.`,
    (anchor, dish) =>
      `You clearly enjoy carb-heavy comfort, so ${dishShort(dish)} should land well.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s hearty noodles fit the pasta vibe you liked before.`,
  ],
  pizza: [
    (anchor, dish) =>
      `Your high pizza scores mean ${dishShort(dish)}'s cheesy savory profile should satisfy you.`,
    (anchor, dish) =>
      `Cheesy comfort fans like you should enjoy ${dishShort(dish)} next.`,
    (anchor, dish) =>
      `${dishShort(dish)} brings the same melty richness you chase in pizza.`,
  ],
  seafood: [
    (anchor, dish) =>
      `Seafood plates you enjoyed suggest ${dishShort(dish)} brings the ocean flavor you like.`,
    (anchor, dish) =>
      `You rate seafood highly, so ${dishShort(dish)} should feel like a natural stretch.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s briny savor fits the seafood lane you already enjoy.`,
  ],
  chicken: [
    (anchor, dish) =>
      `Chicken dishes like ${dishShort(anchor, 2)} you rated high make ${dishShort(dish)} an easy fit.`,
    (anchor, dish) =>
      `You clearly trust chicken mains, so ${dishShort(dish)} should be a safe bet.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s poultry focus matches what you already order most.`,
  ],
  beef: [
    (anchor, dish) =>
      `Hearty beef mains you loved suggest ${dishShort(dish)}'s savory protein is your lane.`,
    (anchor, dish) =>
      `You lean toward beefy comfort, so ${dishShort(dish)} should feel satisfying.`,
    (anchor, dish) =>
      `${dishShort(dish)}'s rich protein fits the hearty plates you score highest.`,
  ],
  breakfast: [
    (anchor, dish) =>
      `Your breakfast favorites like ${dishShort(anchor, 2)} show ${dishShort(dish)} suits your morning cravings.`,
    (anchor, dish) =>
      `Morning comfort fans like you should still enjoy ${dishShort(dish)}'s easy richness.`,
    (anchor, dish) =>
      `${dishShort(dish)} has the brunchy comfort you already chase.`,
  ],
};

const BRIDGE_REASONS: Record<string, Record<string, ReasonBuilder[]>> = {
  kabob: {
    beef: [
      (anchor, dish) =>
        `Your kabobs like ${dishShort(anchor, 2)} show bold meat love; ${dishShort(dish)} fits.`,
      (anchor, dish) =>
        `Skewered spice fans like you should enjoy ${dishShort(dish)}'s hearty beef build.`,
    ],
    chicken: [
      (anchor, dish) =>
        `Grilled kabobs you loved point toward ${dishShort(dish)}'s seasoned poultry.`,
      (anchor, dish) =>
        `You already like spiced grilled meat, so ${dishShort(dish)} should click.`,
    ],
  },
  tangy: {
    beef: [
      (anchor, dish) =>
        `Tangy plates like ${dishShort(anchor, 2)} suggest ${dishShort(dish)}'s rich beef savor.`,
      (anchor, dish) =>
        `Bright marinades you enjoy pair well with ${dishShort(dish)}'s savory depth.`,
    ],
    chicken: [
      (anchor, dish) =>
        `Citrusy plates you loved make ${dishShort(dish)}'s marinated chicken an easy yes.`,
      (anchor, dish) =>
        `You like bright flavor, so ${dishShort(dish)}'s tangy poultry should work.`,
    ],
    crispy: [
      (anchor, dish) =>
        `Sweet-tangy plates you enjoy point to ${dishShort(dish)}'s glazed crunch.`,
      (anchor, dish) =>
        `Your love for bright flavor fits ${dishShort(dish)}'s sweet fried style.`,
    ],
  },
  spicy: {
    creamy: [
      (anchor, dish) =>
        `Your spicy favorites like ${dishShort(anchor, 2)} pair well with ${dishShort(dish)}'s rich heat.`,
    ],
    smoky: [
      (anchor, dish) =>
        `Heat lovers like you who enjoyed ${dishShort(anchor, 2)} should try ${dishShort(dish)}.`,
    ],
  },
};

export interface ReasonBuildOptions {
  pickIndex?: number;
  usedReasons?: Set<string>;
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function fitWordCount(text: string, max = 15) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > max) return words.slice(0, max).join(" ");
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

function reasonSignature(reason: string) {
  return reason
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");
}

function isTooSimilar(reason: string, usedReasons: Set<string>) {
  const signature = reasonSignature(reason);
  if (!signature) return false;

  for (const used of Array.from(usedReasons)) {
    const usedSignature = reasonSignature(used);
    if (signature === usedSignature) return true;

    const reasonWords = signature.split(" ");
    const usedWords = usedSignature.split(" ");
    const sharedPrefix = reasonWords.filter((word, index) => usedWords[index] === word).length;
    if (sharedPrefix >= 4) return true;
  }

  return false;
}

function pickVariant<T>(items: T[], pickIndex: number, offset = 0) {
  if (items.length === 0) return null;
  return items[(pickIndex + offset) % items.length];
}

function chooseUniqueReason(
  builders: ReasonBuilder[],
  anchorDish: string,
  dish: string,
  restaurant: string,
  pickIndex: number,
  usedReasons: Set<string>
) {
  for (let offset = 0; offset < builders.length; offset++) {
    const builder = pickVariant(builders, pickIndex, offset);
    if (!builder) continue;

    const reason = fitWordCount(builder(anchorDish, dish, restaurant), RECOMMENDATION_REASON_MAX_WORDS);
    if (!isTooSimilar(reason, usedReasons) && !isGenericReason(reason)) {
      usedReasons.add(reasonSignature(reason));
      return reason;
    }
  }

  return null;
}

function reasonForTrait(
  trait: string,
  dish: string,
  restaurant: string,
  anchorDish: string,
  pickIndex: number,
  usedReasons: Set<string>
) {
  const builders = TRAIT_REASON_VARIANTS[trait] ?? [
    (anchor, dishName, rest) =>
      `High scores on ${dishShort(anchor, 2)} suggest ${dishShort(dishName)} at ${dishShort(rest, 2)} fits your taste.`,
  ];

  return (
    chooseUniqueReason(builders, anchorDish, dish, restaurant, pickIndex, usedReasons) ??
    fitWordCount(
      builders[pickIndex % builders.length](anchorDish, dish, restaurant),
      RECOMMENDATION_REASON_MAX_WORDS
    )
  );
}

export function buildDishReason(
  dish: string,
  restaurant: string,
  history: PlateHistoryItem[],
  locationLabel: string | null,
  options?: ReasonBuildOptions
) {
  const pickIndex = options?.pickIndex ?? 0;
  const usedReasons = options?.usedReasons ?? new Set<string>();
  const top = [...history].sort((a, b) => b.score - a.score);
  const anchor = top[pickIndex % top.length] ?? top[0];
  const anchorDish = anchor?.dish_name ?? "your favorites";
  const anchorRestaurant = anchor?.restaurant_name ?? "";

  const anchorTraits = extractTraits(anchorDish, anchorRestaurant);
  const dishTraits = extractTraits(dish, restaurant);
  const sharedTrait = TRAIT_PRIORITY.find(
    (trait) => anchorTraits.has(trait) && dishTraits.has(trait)
  );
  const dishPrimary = anchorPrimary(dishTraits);
  const anchorPrimaryTrait = anchorPrimary(anchorTraits);

  const candidates: string[] = [];

  if (sharedTrait) {
    candidates.push(reasonForTrait(sharedTrait, dish, restaurant, anchorDish, pickIndex, usedReasons));
  }

  const bridgeBuilders =
    anchorPrimaryTrait && dishPrimary
      ? BRIDGE_REASONS[anchorPrimaryTrait]?.[dishPrimary]
      : undefined;

  if (bridgeBuilders) {
    const bridge = chooseUniqueReason(
      bridgeBuilders,
      anchorDish,
      dish,
      restaurant,
      pickIndex,
      usedReasons
    );
    if (bridge) candidates.push(bridge);
  }

  if (dishPrimary && dishPrimary !== anchorPrimaryTrait) {
    candidates.push(
      reasonForTrait(dishPrimary, dish, restaurant, anchorDish, pickIndex + 1, usedReasons)
    );
  }

  if (anchorPrimaryTrait) {
    candidates.push(
      reasonForTrait(
        anchorPrimaryTrait,
        dish,
        restaurant,
        anchorDish,
        pickIndex + 2,
        usedReasons
      )
    );
  }

  const location = locationLabel?.split(",")[0]?.trim();
  if (location && dishPrimary) {
    candidates.push(
      fitWordCount(
        `Near ${location}, ${dishShort(dish)} is a strong ${dishPrimary} pick for your taste.`,
        RECOMMENDATION_REASON_MAX_WORDS
      )
    );
  }

  candidates.push(
    fitWordCount(
      `Because you rated ${dishShort(anchorDish, 2)} highly, ${dishShort(dish)} at ${dishShort(restaurant, 2)} makes sense.`,
      RECOMMENDATION_REASON_MAX_WORDS
    )
  );

  for (const reason of candidates) {
    if (!reason || isGenericReason(reason) || isTooSimilar(reason, usedReasons)) continue;
    usedReasons.add(reasonSignature(reason));
    return reason;
  }

  const fallback = fitWordCount(candidates[0] ?? "", RECOMMENDATION_REASON_MAX_WORDS);
  usedReasons.add(reasonSignature(fallback));
  return fallback;
}

export function resolveDishReason(
  reason: string,
  restaurant: string,
  dish: string,
  history: PlateHistoryItem[],
  locationLabel: string | null,
  options?: ReasonBuildOptions
) {
  const cleaned = reason.trim();
  const count = wordCount(cleaned);
  const usedReasons = options?.usedReasons ?? new Set<string>();

  if (
    !isGenericReason(cleaned) &&
    !isTooSimilar(cleaned, usedReasons) &&
    count >= 1 &&
    count <= RECOMMENDATION_REASON_MAX_WORDS
  ) {
    usedReasons.add(reasonSignature(cleaned));
    return cleaned;
  }

  return buildDishReason(dish, restaurant, history, locationLabel, options);
}

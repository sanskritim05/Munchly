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
  /you rated/i,
  /you rate /i,
  /because you rated/i,
  /high score/i,
  /score.*highly/i,
  /you seem to like/i,
  /you loved/i,
  /heat seekers like you/i,
  /fresh pick/i,
  /is a fresh pick/i,
  /^a well-known pick for/i,
  /^popular near you/i,
  /is a new spot to try/i,
  /is a different order/i,
  /is worth a try/i,
  /fits what you'?ve been posting/i,
  /switches up your usual comfort/i,
  /offers a different comfort-food angle/i,
  /adds a different treat/i,
  /brings another indulgent option/i,
  /tries sweeter food/i,
  /tries hearty food/i,
  /tries Asian-leaning food/i,
  /tries lighter food/i,
  /tries breakfast food/i,
  /contrasts nicely with your/i,
  /pairs well with your/i,
];

const TRAIT_PATTERNS: { trait: string; pattern: RegExp }[] = [
  { trait: "salad", pattern: /\b(salad|papaya salad|greens|slaw|cucumber salad)\b/i },
  { trait: "asian", pattern: /\b(thai|pad thai|papaya|pho|ramen|bao|dumpling|wok|sushi|teriyaki|xiao long|dan dan|noodles)\b/i },
  { trait: "dessert", pattern: /\b(donut|donuts|doughnut|cronut|cupcake|brownie|churro|muffin|pudding|dessert|cake|cookie|banana pudding|pastry|pie|frosting|glazed|sundae|ice cream)\b/i },
  { trait: "kabob", pattern: /\b(kabob|kabab|kebab|skewer|shawarma|gyro|tikka|tandoori)\b/i },
  { trait: "spicy", pattern: /\b(spicy|hot|jalape|buffalo|peri|cajun|sriracha|habanero|chipotle|chili)\b/i },
  { trait: "smoky", pattern: /\b(smoky|smoke|bbq|barbecue|grilled|charred|bourbon|ribeye|steak)\b/i },
  { trait: "creamy", pattern: /\b(creamy|alfredo|cheese|queso|mac and cheese|butter|custard|carbonara|pesto|vodka sauce|gnocchi|risotto)\b/i },
  { trait: "tangy", pattern: /\b(tangy|yogurt|lemon|citrus|vinegar|tomato|salsa|pickle|mojo)\b/i },
  { trait: "crispy", pattern: /\b(crispy|crunchy|fried|crisp|tenders|nuggets|wings|orange chicken)\b/i },
  { trait: "sweet", pattern: /\b(sweet|honey|caramel|maple|glazed|brown sugar|teriyaki|orange)\b/i },
  { trait: "bowl", pattern: /\b(bowl|burrito bowl|harvest|greens|grain|tropichop)\b/i },
  { trait: "pasta", pattern: /\b(pasta|spaghetti|lasagna|noodle|ramen|fettuccine|gnocchi|rigatoni|penne|bolognese|marinara|arrabbiata|alfredo)\b/i },
  { trait: "pizza", pattern: /\b(pizza|pepperoni|calzone)\b/i },
  { trait: "seafood", pattern: /\b(fish|shrimp|salmon|tuna|crab|lobster|sushi|poke)\b/i },
  { trait: "chicken", pattern: /\b(chicken|poultry|wings)\b/i },
  { trait: "beef", pattern: /\b(beef|burger|steak|brisket|roast beef|ribeye|sirloin|cheeseburger)\b/i },
  { trait: "breakfast", pattern: /\b(pancake|waffle|breakfast|eggs|biscuit|omelet)\b/i },
];

const TRAIT_PRIORITY = [
  "kabob",
  "asian",
  "spicy",
  "smoky",
  "creamy",
  "crispy",
  "salad",
  "seafood",
  "pasta",
  "pizza",
  "bowl",
  "chicken",
  "beef",
  "dessert",
  "breakfast",
  "tangy",
  "sweet",
];

type ReasonBuilder = (anchorDish: string, dish: string, restaurant: string) => string;

const TRAIT_REASON_VARIANTS: Record<string, ReasonBuilder[]> = {
  kabob: [
    (anchor, dish) =>
      `You posted grilled kabobs like ${dishLabel(anchor)}; ${dishLabel(dish)} has similar seasoned char.`,
    (anchor, dish) =>
      `Skewered plates you shared point toward ${dishLabel(dish)}'s bold spice.`,
    (anchor, dish) =>
      `${dishLabel(dish)} brings grilled spice energy like your ${dishLabel(anchor)} post.`,
  ],
  spicy: [
    (anchor, dish) =>
      `You posted spicy food like ${dishLabel(anchor)}; ${dishLabel(dish)} should bring similar heat.`,
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post had heat; ${dishLabel(dish)} keeps that going.`,
    (anchor, dish) =>
      `${dishLabel(dish)} matches the spice level in plates you've shared.`,
  ],
  smoky: [
    (anchor, dish) =>
      `You posted smoky grilled food like ${dishLabel(anchor)}; ${dishLabel(dish)} has charred depth.`,
    (anchor, dish) =>
      `Grilled posts like ${dishLabel(anchor)} suggest ${dishLabel(dish)}'s savor could appeal.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s smoke and char fit plates you've already shared.`,
  ],
  creamy: [
    (anchor, dish) =>
      `You posted creamy comfort like ${dishLabel(anchor)}; ${dishLabel(dish)} has similar richness.`,
    (anchor, dish) =>
      `Rich plates you shared make ${dishLabel(dish)} a natural next try.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s lush texture fits what you've been ordering.`,
  ],
  tangy: [
    (anchor, dish) =>
      `You posted bright flavors like ${dishLabel(anchor)}; ${dishLabel(dish)} has a similar tang.`,
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post was bright and bold; ${dishLabel(dish)} follows that lane.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s citrusy punch fits the plates you've been sharing.`,
  ],
  crispy: [
    (anchor, dish) =>
      `You posted crispy fried food like ${dishLabel(anchor)}; ${dishLabel(dish)} should crunch too.`,
    (anchor, dish) =>
      `Fried plates you shared point toward ${dishLabel(dish)}'s crisp texture.`,
    (anchor, dish) =>
      `${dishLabel(dish)} should satisfy the same crunch as your ${dishLabel(anchor)} post.`,
  ],
  sweet: [
    (anchor, dish) =>
      `You posted sweeter plates like ${dishLabel(anchor)}; ${dishLabel(dish)} has a similar glaze.`,
    (anchor, dish) =>
      `Sweet-savory posts like ${dishLabel(anchor)} make ${dishLabel(dish)} a good stretch.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s sweetness fits the style of food you've shared.`,
  ],
  bowl: [
    (anchor, dish) =>
      `You posted bowl-style plates like ${dishLabel(anchor)}; ${dishLabel(dish)} has a similar build.`,
    (anchor, dish) =>
      `Balanced bowls you've shared suggest ${dishLabel(dish)} should feel familiar.`,
    (anchor, dish) =>
      `${dishLabel(dish)} has the layered bowl energy from your ${dishLabel(anchor)} post.`,
  ],
  pasta: [
    (anchor, dish) =>
      `You posted pasta or noodles like ${dishLabel(anchor)}; ${dishLabel(dish)} keeps that carb comfort.`,
    (anchor, dish) =>
      `Noodle posts you've shared point toward ${dishLabel(dish)} as a next try.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s hearty carbs fit the plates you've been posting.`,
  ],
  pizza: [
    (anchor, dish) =>
      `You posted pizza-like comfort before; ${dishLabel(dish)} has cheesy savory appeal.`,
    (anchor, dish) =>
      `Cheesy posts you've shared make ${dishLabel(dish)} an easy next pick.`,
    (anchor, dish) =>
      `${dishLabel(dish)} brings melty richness like the plates you've shared.`,
  ],
  seafood: [
    (anchor, dish) =>
      `You posted seafood like ${dishLabel(anchor)}; ${dishLabel(dish)} stays in that lane.`,
    (anchor, dish) =>
      `Ocean-forward posts you've shared suggest ${dishLabel(dish)} could work.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s seafood flavor fits what you've already ordered.`,
  ],
  chicken: [
    (anchor, dish) =>
      `You often post chicken like ${dishLabel(anchor)}; ${dishLabel(dish)} stays in that lane.`,
    (anchor, dish) =>
      `Chicken plates you've shared make ${dishLabel(dish)} a natural next order.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s poultry focus matches what you've been posting.`,
  ],
  beef: [
    (anchor, dish) =>
      `You posted hearty beef like ${dishLabel(anchor)}; ${dishLabel(dish)} fits that protein style.`,
    (anchor, dish) =>
      `Beefy posts you've shared suggest ${dishLabel(dish)} could satisfy.`,
    (anchor, dish) =>
      `${dishLabel(dish)}'s rich protein matches the hearty plates you've shared.`,
  ],
  breakfast: [
    (anchor, dish) =>
      `You posted breakfast plates like ${dishLabel(anchor)}; ${dishLabel(dish)} suits that comfort.`,
    (anchor, dish) =>
      `Morning-style posts you've shared point toward ${dishLabel(dish)}.`,
    (anchor, dish) =>
      `${dishLabel(dish)} has the brunchy comfort from your ${dishLabel(anchor)} post.`,
  ],
  salad: [
    (anchor, dish) =>
      `You post lighter plates like ${dishLabel(anchor)}; ${dishLabel(dish)} keeps that fresh balance.`,
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post was bright and light; ${dishLabel(dish)} should feel similar.`,
  ],
  asian: [
    (anchor, dish) =>
      `You post Asian-leaning dishes like ${dishLabel(anchor)}; ${dishLabel(dish)} should feel familiar.`,
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post had bold flavors; ${dishLabel(dish)} is a natural next stretch.`,
  ],
  dessert: [
    (anchor, dish) =>
      `You share sweeter plates like ${dishLabel(anchor)}; ${dishLabel(dish)} adds another treat.`,
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post leaned sweet; ${dishLabel(dish)} brings indulgence in a new way.`,
  ],
};

const BRIDGE_REASONS: Record<string, Record<string, ReasonBuilder[]>> = {
  kabob: {
    beef: [
      (anchor, dish) =>
        `You posted kabobs like ${dishLabel(anchor)}; ${dishLabel(dish)} fits that bold meat style.`,
      (anchor, dish) =>
        `Grilled spice posts like ${dishLabel(anchor)} point toward ${dishLabel(dish)}'s hearty beef.`,
    ],
    chicken: [
      (anchor, dish) =>
        `Kabob posts you've shared suggest ${dishLabel(dish)}'s seasoned poultry could work.`,
      (anchor, dish) =>
        `You already post spiced grilled meat; ${dishLabel(dish)} should feel familiar.`,
    ],
  },
  tangy: {
    beef: [
      (anchor, dish) =>
        `Bright posts like ${dishLabel(anchor)} suggest ${dishLabel(dish)}'s rich beef savor.`,
      (anchor, dish) =>
        `You share tangy plates often; ${dishLabel(dish)} brings savory depth too.`,
    ],
    chicken: [
      (anchor, dish) =>
        `Citrusy posts like ${dishLabel(anchor)} make ${dishLabel(dish)}'s chicken an easy yes.`,
      (anchor, dish) =>
        `You post bright flavors; ${dishLabel(dish)}'s marinated poultry should work.`,
    ],
    crispy: [
      (anchor, dish) =>
        `Bright plates you've posted point to ${dishLabel(dish)}'s sweet fried crunch.`,
      (anchor, dish) =>
        `Your ${dishLabel(anchor)} post was bright; ${dishLabel(dish)} adds crispy comfort.`,
    ],
  },
  spicy: {
    creamy: [
      (anchor, dish) =>
        `Spicy posts like ${dishLabel(anchor)} pair well with ${dishLabel(dish)}'s rich heat.`,
    ],
    smoky: [
      (anchor, dish) =>
        `You post spicy food like ${dishLabel(anchor)}; ${dishLabel(dish)} brings bold char too.`,
    ],
  },
  pasta: {
    spicy: [
      (anchor, dish) =>
        `Noodle posts like ${dishLabel(anchor)} suggest ${dishLabel(dish)}'s spicy sauce could click.`,
    ],
  },
};

export interface ReasonBuildOptions {
  pickIndex?: number;
  usedReasons?: Set<string>;
  usedAnchors?: Set<string>;
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

function dishLabel(name: string, maxWords = 4) {
  const cleaned = name
    .replace(/[,;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  const short = words.slice(0, maxWords).join(" ");
  if (short.length <= 32) return short;
  return `${short.slice(0, 31).trim()}…`;
}

function restaurantLabel(name: string) {
  const cleaned = name.trim();
  if (cleaned.length <= 26) return cleaned;
  return dishLabel(cleaned, 3);
}

type FoodStyle = "fresh" | "breakfast" | "sweet" | "asian" | "comfort";

const STYLE_WORDS: Record<FoodStyle, string> = {
  fresh: "lighter",
  breakfast: "breakfast",
  sweet: "sweeter",
  asian: "Asian-leaning",
  comfort: "hearty",
};

function inferFoodStyle(...parts: (string | null | undefined)[]) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (/salad|papaya salad|greens|slaw|cucumber/.test(text)) return "fresh" as const;
  if (/pancake|waffle|breakfast|eggs|biscuit|brunch|oatmeal/.test(text)) return "breakfast" as const;
  if (/donut|donuts|doughnut|cronut|cupcake|brownie|churro|muffin|pudding|dessert|cake|cookie|banana|pastry|pie|frosting|sundae|ice cream/.test(text)) {
    return "sweet" as const;
  }
  if (/pasta|spaghetti|fettuccine|gnocchi|rigatoni|penne|vodka|pesto|carbonara|bolognese|marinara|arrabbiata|alfredo|lasagna/.test(text)) {
    return "comfort" as const;
  }
  if (/thai|pad thai|papaya|pho|ramen|bao|dumpling|wok|sushi|teriyaki|xiao long|dan dan|noodle/.test(text)) {
    return "asian" as const;
  }
  return "comfort" as const;
}

const STYLE_REASONS: Record<FoodStyle, ReasonBuilder[]> = {
  fresh: [
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post was light and fresh; ${dishLabel(dish)} keeps that same balance.`,
    (anchor, dish) =>
      `You share lighter plates like ${dishLabel(anchor)}; ${dishLabel(dish)} should feel similarly fresh.`,
  ],
  breakfast: [
    (anchor, dish) =>
      `You post breakfast plates like ${dishLabel(anchor)}; ${dishLabel(dish)} fits that morning comfort.`,
    (anchor, dish) =>
      `Morning food like ${dishLabel(anchor)} suggests ${dishLabel(dish)} could hit a similar note.`,
  ],
  sweet: [
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post leaned sweet; ${dishLabel(dish)} brings another indulgent option.`,
    (anchor, dish) =>
      `You share sweeter plates like ${dishLabel(anchor)}; ${dishLabel(dish)} adds a different treat.`,
  ],
  asian: [
    (anchor, dish) =>
      `Your ${dishLabel(anchor)} post had bold Asian flavors; ${dishLabel(dish)} is a natural next stretch.`,
    (anchor, dish) =>
      `You post Asian-leaning dishes like ${dishLabel(anchor)}; ${dishLabel(dish)} should feel familiar.`,
  ],
  comfort: [
    (anchor, dish, rest) =>
      `After posting ${dishLabel(anchor)}, ${dishLabel(dish)} at ${restaurantLabel(rest)} switches up your usual comfort.`,
    (anchor, dish) =>
      `You ordered ${dishLabel(anchor)} before; ${dishLabel(dish)} offers a different comfort-food angle.`,
  ],
};

function isDessertLike(
  dish: string,
  restaurant: string,
  traits = extractTraits(dish, restaurant),
  style = inferFoodStyle(dish, restaurant)
) {
  return traits.has("dessert") || style === "sweet";
}

const CONTRAST_REASONS: ReasonBuilder[] = [
  (anchor, dish, rest) =>
    `You post sweets like ${dishLabel(anchor)}; ${dishLabel(dish)} at ${restaurantLabel(rest)} is a savory stretch.`,
  (anchor, dish) =>
    `Nothing like ${dishLabel(anchor)} on purpose: ${dishLabel(dish)} is a hearty change of pace.`,
  (anchor, dish, rest) =>
    `Your ${dishLabel(anchor)} posts skew sweet; ${dishLabel(dish)} at ${restaurantLabel(rest)} switches lanes.`,
];

export function scoreTasteConnection(
  anchorDish: string,
  anchorRestaurant: string,
  dish: string,
  restaurant: string
) {
  const anchorTraits = extractTraits(anchorDish, anchorRestaurant);
  const dishTraits = extractTraits(dish, restaurant);
  const anchorStyle = inferFoodStyle(anchorDish, anchorRestaurant);
  const dishStyle = inferFoodStyle(dish, restaurant);
  const anchorDessert = isDessertLike(anchorDish, anchorRestaurant, anchorTraits, anchorStyle);
  const dishDessert = isDessertLike(dish, restaurant, dishTraits, dishStyle);

  if (anchorDessert && !dishDessert) return 0;

  let score = 0;

  for (const trait of TRAIT_PRIORITY) {
    if (!anchorTraits.has(trait) || !dishTraits.has(trait)) continue;
    if (trait === "sweet" && !dishDessert) continue;
    score += 15;
  }

  if (anchorStyle === dishStyle) score += 20;
  if (anchorDessert && dishDessert) score += 25;

  return score;
}

export function scorePickForHistory(
  history: PlateHistoryItem[],
  dish: string,
  restaurant: string
) {
  if (history.length === 0) return 0;
  if (!shouldRecommendPick(history, dish, restaurant)) return -100;

  let total = 0;
  let matches = 0;

  for (const post of history.slice(0, 20)) {
    const connection = scoreTasteConnection(
      post.dish_name,
      post.restaurant_name,
      dish,
      restaurant
    );
    if (connection <= 0) continue;
    total += connection;
    matches += 1;
  }

  return matches > 0 ? total / matches : 0;
}

const TASTE_PROFILE_LOOKBACK = 20;

const TRAIT_THEME_LABELS: Record<string, string> = {
  pasta: "pasta",
  spicy: "spicy",
  creamy: "creamy",
  pizza: "pizza",
  crispy: "crispy",
  smoky: "smoky",
  tangy: "bright",
  salad: "lighter",
  asian: "Asian-leaning",
  dessert: "sweet",
  breakfast: "breakfast",
  chicken: "chicken",
  beef: "hearty",
  seafood: "seafood",
  kabob: "grilled",
  bowl: "bowl-style",
};

function dominantTraits(history: PlateHistoryItem[], limit = 2) {
  const counts = new Map<string, number>();

  for (const post of history.slice(0, TASTE_PROFILE_LOOKBACK)) {
    for (const trait of Array.from(extractTraits(post.dish_name, post.restaurant_name))) {
      if (trait === "sweet" || trait === "bowl") continue;
      counts.set(trait, (counts.get(trait) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([trait]) => TRAIT_THEME_LABELS[trait] ?? trait);
}

export function buildTasteSummaryFromHistory(history: PlateHistoryItem[]) {
  if (history.length === 0) {
    return "Post a few plates to unlock personalized picks.";
  }

  const traits = dominantTraits(history, 2);
  if (traits.length >= 2) {
    return `Based on the ${traits[0]} and ${traits[1]} dishes you've posted, here are new spots to try.`;
  }
  if (traits.length === 1) {
    return `Based on the ${traits[0]} dishes you've shared, here are new spots to try.`;
  }

  const profile = buildTasteProfile(history);
  return `Based on the ${STYLE_WORDS[profile.primaryStyle]} plates you've posted, here are new spots to try.`;
}

function profileThemeLabel(history: PlateHistoryItem[]) {
  const traits = dominantTraits(history, 1);
  if (traits.length > 0) return traits[0];
  const profile = buildTasteProfile(history);
  return STYLE_WORDS[profile.primaryStyle];
}

export interface TasteProfile {
  recentPosts: PlateHistoryItem[];
  primaryStyle: FoodStyle;
  isPrimarilySavory: boolean;
  isPrimarilyDessert: boolean;
}

export function buildTasteProfile(history: PlateHistoryItem[]): TasteProfile {
  const recentPosts = history.slice(0, TASTE_PROFILE_LOOKBACK);
  let savoryWeight = 0;
  let dessertWeight = 0;
  const styleWeights = new Map<FoodStyle, number>();

  recentPosts.forEach((post) => {
    const style = inferFoodStyle(post.dish_name, post.restaurant_name);
    styleWeights.set(style, (styleWeights.get(style) ?? 0) + 1);

    if (isDessertLike(post.dish_name, post.restaurant_name)) {
      dessertWeight += 1;
    } else {
      savoryWeight += 1;
    }
  });

  const primaryStyle =
    Array.from(styleWeights.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "comfort";
  const total = savoryWeight + dessertWeight || 1;

  return {
    recentPosts,
    primaryStyle,
    isPrimarilySavory: savoryWeight / total >= 0.55,
    isPrimarilyDessert: dessertWeight / total >= 0.55,
  };
}

export function shouldRecommendPick(
  history: PlateHistoryItem[],
  dish: string,
  restaurant: string
) {
  const profile = buildTasteProfile(history);
  const dishDessert = isDessertLike(dish, restaurant);

  if (profile.isPrimarilySavory && dishDessert) {
    return false;
  }

  return true;
}

function anchorKey(dishName: string) {
  return dishName.trim().toLowerCase();
}

function pickAnchorPost(
  history: PlateHistoryItem[],
  dish: string,
  restaurant: string,
  usedAnchors?: Set<string>
): PlateHistoryItem | null {
  if (history.length === 0) return null;

  let best: PlateHistoryItem | null = null;
  let bestScore = 0;

  for (const post of history.slice(0, TASTE_PROFILE_LOOKBACK)) {
    const key = anchorKey(post.dish_name);
    if (usedAnchors?.has(key) && history.length > 2) continue;

    const connection = scoreTasteConnection(
      post.dish_name,
      post.restaurant_name,
      dish,
      restaurant
    );

    if (connection > bestScore) {
      bestScore = connection;
      best = post;
    }
  }

  if (bestScore >= 15) return best;

  for (const post of history.slice(0, TASTE_PROFILE_LOOKBACK)) {
    const key = anchorKey(post.dish_name);
    if (usedAnchors?.has(key)) continue;

    const connection = scoreTasteConnection(
      post.dish_name,
      post.restaurant_name,
      dish,
      restaurant
    );
    if (connection > 0) return post;
  }

  return null;
}

function hasMeaningfulConnection(
  anchorDish: string,
  anchorRestaurant: string,
  dish: string,
  restaurant: string
) {
  return scoreTasteConnection(anchorDish, anchorRestaurant, dish, restaurant) >= 20;
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
      `You posted ${dishLabel(anchor)}; ${dishLabel(dishName)} at ${restaurantLabel(rest)} is worth trying.`,
  ];

  return (
    chooseUniqueReason(builders, anchorDish, dish, restaurant, pickIndex, usedReasons) ??
    null
  );
}

function sameProteinReason(
  anchorDish: string,
  dish: string,
  anchorTraits: Set<string>,
  dishTraits: Set<string>,
  pickIndex: number
) {
  const variants: Record<string, string[]> = {
    chicken: [
      `You often post chicken like ${dishLabel(anchorDish)}; ${dishLabel(dish)} stays in that lane.`,
      `Chicken plates you've shared point toward ${dishLabel(dish)} as a next try.`,
    ],
    beef: [
      `You posted hearty beef like ${dishLabel(anchorDish)}; ${dishLabel(dish)} fits that style.`,
      `Beefy posts you've shared suggest ${dishLabel(dish)} could work well.`,
    ],
    seafood: [
      `Seafood posts like ${dishLabel(anchorDish)} make ${dishLabel(dish)} a sensible stretch.`,
    ],
  };

  for (const protein of ["chicken", "beef", "seafood"]) {
    if (anchorTraits.has(protein) && dishTraits.has(protein)) {
      const options = variants[protein];
      return options[pickIndex % options.length];
    }
  }

  return null;
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
  const usedAnchors = options?.usedAnchors;
  const posts = [...history];
  const anchorPost = pickAnchorPost(posts, dish, restaurant, usedAnchors);
  const theme = profileThemeLabel(history);

  if (anchorPost && usedAnchors) {
    usedAnchors.add(anchorKey(anchorPost.dish_name));
  }

  const anchorDish = anchorPost?.dish_name ?? "your posts";
  const anchorRestaurant = anchorPost?.restaurant_name ?? "";

  const anchorTraits = extractTraits(anchorDish, anchorRestaurant);
  const dishTraits = extractTraits(dish, restaurant);
  const sharedTrait = TRAIT_PRIORITY.find(
    (trait) => anchorTraits.has(trait) && dishTraits.has(trait)
  );
  const dishPrimary = anchorPrimary(dishTraits);
  const anchorPrimaryTrait = anchorPrimary(anchorTraits);

  const anchorStyle = inferFoodStyle(anchorDish, anchorRestaurant);
  const dishStyle = inferFoodStyle(dish, restaurant);
  const connected = anchorPost
    ? hasMeaningfulConnection(anchorDish, anchorRestaurant, dish, restaurant)
    : false;
  const anchorDessert = isDessertLike(anchorDish, anchorRestaurant, anchorTraits, anchorStyle);
  const dishDessert = isDessertLike(dish, restaurant, dishTraits, dishStyle);

  const candidates: string[] = [];

  if (!anchorPost) {
    candidates.push(
      `You often post ${theme} dishes; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} fits that pattern.`,
      `Your posts skew ${theme}; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} is worth a try.`,
      `${dishLabel(dish)} at ${restaurantLabel(restaurant)} matches the kind of food you've been sharing.`
    );
  } else if (connected) {
    if (sharedTrait) {
      const shared = reasonForTrait(
        sharedTrait,
        dish,
        restaurant,
        anchorDish,
        pickIndex,
        usedReasons
      );
      if (shared) candidates.push(shared);
    }

    if (
      anchorPrimaryTrait &&
      dishPrimary &&
      anchorTraits.has(anchorPrimaryTrait) &&
      dishTraits.has(dishPrimary)
    ) {
      const bridgeBuilders = BRIDGE_REASONS[anchorPrimaryTrait]?.[dishPrimary];
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
    }

    const proteinReason = sameProteinReason(
      anchorDish,
      dish,
      anchorTraits,
      dishTraits,
      pickIndex
    );
    if (proteinReason) candidates.push(proteinReason);

    if (anchorStyle === dishStyle) {
      const styleBuilders = STYLE_REASONS[anchorStyle] ?? STYLE_REASONS.comfort;
      const styleReason = chooseUniqueReason(
        styleBuilders,
        anchorDish,
        dish,
        restaurant,
        pickIndex,
        usedReasons
      );
      if (styleReason) candidates.push(styleReason);
    } else if (anchorStyle !== dishStyle && !anchorDessert && !dishDessert) {
      candidates.push(
        `Your ${dishLabel(anchorDish)} post was ${STYLE_WORDS[anchorStyle]}; ${dishLabel(dish)} tries ${STYLE_WORDS[dishStyle]} food instead.`,
        `You usually post ${STYLE_WORDS[anchorStyle]} plates like ${dishLabel(anchorDish)}; ${dishLabel(dish)} switches lanes.`
      );
    }
  } else if (anchorPost && !connected) {
    candidates.push(
      `You often post ${theme} dishes; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} stretches your usual lineup.`,
      `Your posts skew ${theme}; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} is a different order to try.`
    );
  } else if (anchorDessert && !dishDessert) {
    const contrast = chooseUniqueReason(
      CONTRAST_REASONS,
      anchorDish,
      dish,
      restaurant,
      pickIndex,
      usedReasons
    );
    if (contrast) candidates.push(contrast);
    candidates.push(
      `You post sweets like ${dishLabel(anchorDish)}; ${dishLabel(dish)} is a savory change of pace.`,
      `Not a dessert match: ${dishLabel(dish)} at ${restaurantLabel(restaurant)} is a different kind of order.`
    );
  } else if (!anchorDessert && dishDessert) {
    candidates.push(
      `Your recent posts like ${dishLabel(anchorDish)} skew savory; ${dishLabel(dish)} is an off-profile sweet pick.`
    );
  } else if (!dishDessert) {
    const styleBuilders = STYLE_REASONS[anchorStyle] ?? STYLE_REASONS.comfort;
    const styleReason = chooseUniqueReason(
      styleBuilders,
      anchorDish,
      dish,
      restaurant,
      pickIndex,
      usedReasons
    );
    if (styleReason) candidates.push(styleReason);

    if (anchorStyle !== dishStyle) {
      candidates.push(
        `Your ${dishLabel(anchorDish)} post was ${STYLE_WORDS[anchorStyle]}; ${dishLabel(dish)} tries ${STYLE_WORDS[dishStyle]} food instead.`
      );
    }
  }

  const location = locationLabel?.split(",")[0]?.trim();
  if (location && connected && anchorPost) {
    candidates.push(
      `Near ${location}, ${dishLabel(dish)} at ${restaurantLabel(restaurant)} fits what you've been posting.`
    );
  }

  for (const reason of candidates) {
    const fitted = fitWordCount(reason, RECOMMENDATION_REASON_MAX_WORDS);
    if (!fitted || isGenericReason(fitted) || isTooSimilar(fitted, usedReasons)) continue;
    usedReasons.add(reasonSignature(fitted));
    return fitted;
  }

  const fallback = fitWordCount(
    anchorPost
      ? anchorDessert && !dishDessert
        ? `You post sweets like ${dishLabel(anchorDish)}; ${dishLabel(dish)} is a savory change of pace.`
        : `You often post ${theme} food; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} is a new pick.`
      : `You often post ${theme} dishes; ${dishLabel(dish)} at ${restaurantLabel(restaurant)} is worth trying.`,
    RECOMMENDATION_REASON_MAX_WORDS
  );
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

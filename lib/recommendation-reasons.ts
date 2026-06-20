import type { PlateHistoryItem } from "@/lib/recommendations";

export const RECOMMENDATION_REASON_MAX_WORDS = 18;
export const RECOMMENDATION_REASON_MIN_WORDS = 8;

const GENERIC_REASON_PATTERNS = [
  /^a well-known pick/i,
  /^popular near/i,
  /you rated/i,
  /you rate /i,
  /because you rated/i,
  /high score/i,
  /score.*highly/i,
  /you seem to like/i,
  /fits your taste profile/i,
  /^they\b/i,
  /\bthey(?:'ve|'re|'d|'ll)?\b/i,
  /\btheir\b/i,
  /\b(items|treats|dishes|food) like\b/i,
];

const TRAIT_PATTERNS: { trait: string; pattern: RegExp }[] = [
  { trait: "salad", pattern: /\b(salad|papaya salad|greens|slaw|cucumber salad)\b/i },
  { trait: "asian", pattern: /\b(thai|pad thai|papaya|pho|ramen|bao|dumpling|wok|sushi|teriyaki|xiao long|dan dan|noodle|orange chicken|kung pao|fried rice|lo mein|chang)\b/i },
  { trait: "dessert", pattern: /\b(donut|donuts|doughnut|cronut|cupcake|brownie|churro|muffin|pudding|dessert|cake|cookie|banana pudding|pastry|pie|frosting|glazed|sundae|ice cream|cinnamon roll)\b/i },
  { trait: "kabob", pattern: /\b(kabob|kabab|kebab|skewer|shawarma|gyro|tikka|tandoori)\b/i },
  { trait: "spicy", pattern: /\b(spicy|hot|jalape|buffalo|peri|cajun|sriracha|habanero|chipotle|chili)\b/i },
  { trait: "smoky", pattern: /\b(smoky|smoke|bbq|barbecue|grilled|charred|bourbon|ribeye|steak)\b/i },
  { trait: "creamy", pattern: /\b(creamy|alfredo|cheese|queso|mac and cheese|butter|custard|carbonara|pesto|vodka sauce|gnocchi|risotto)\b/i },
  { trait: "tangy", pattern: /\b(tangy|yogurt|lemon|citrus|vinegar|tomato|salsa|pickle|mojo)\b/i },
  { trait: "crispy", pattern: /\b(crispy|crunchy|fried|crisp|tenders|nuggets|wings|orange chicken)\b/i },
  { trait: "sweet", pattern: /\b(sweet|honey|caramel|maple|glazed|brown sugar|teriyaki)\b/i },
  { trait: "bowl", pattern: /\b(bowl|burrito bowl|harvest|greens|grain|tropichop)\b/i },
  { trait: "pasta", pattern: /\b(pasta|spaghetti|lasagna|noodle|ramen|fettuccine|gnocchi|rigatoni|penne|bolognese|marinara|arrabbiata|alfredo)\b/i },
  { trait: "pizza", pattern: /\b(pizza|pepperoni|calzone)\b/i },
  { trait: "seafood", pattern: /\b(fish|shrimp|salmon|tuna|crab|lobster|sushi|poke)\b/i },
  { trait: "chicken", pattern: /\b(chicken|poultry|wings)\b/i },
  { trait: "beef", pattern: /\b(beef|burger|steak|brisket|roast beef|ribeye|sirloin|cheeseburger)\b/i },
  { trait: "breakfast", pattern: /\b(pancake|waffle|breakfast|eggs?|eggslut|biscuit|omelet|brunch)\b/i },
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

const DANGLING_TAIL =
  /^(is|are|was|were|be|been|being|a|an|the|and|or|at|to|for|with|your|you|new|pick|try|like|post|posts|&)$/i;
const DANGLING_TAIL_TWO =
  /^(is a|is an|a new|at the|should be|could be|will be|has a|have a)$/i;

function appendPeriod(text: string) {
  const trimmed = text.trim().replace(/[.,;!?\s]+$/g, "").trim();
  if (!trimmed) return trimmed;
  if (/[!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

export function isReasonComplete(reason: string) {
  const trimmed = reason.trim().replace(/[.!?]+$/, "");
  if (wordCount(trimmed) < 4) return false;
  if (trimmed.endsWith("&")) return false;

  const words = trimmed.split(/\s+/);
  const last = words[words.length - 1].toLowerCase();
  const lastTwo = words.slice(-2).join(" ").toLowerCase();

  if (DANGLING_TAIL.test(last)) return false;
  if (DANGLING_TAIL_TWO.test(lastTwo)) return false;

  return true;
}

export function finalizeReason(
  text: string,
  max = RECOMMENDATION_REASON_MAX_WORDS
): string | null {
  const cleaned = text.replace(/[—–]/g, "-").trim();
  if (!cleaned) return null;

  if (wordCount(cleaned) <= max && wordCount(cleaned) >= RECOMMENDATION_REASON_MIN_WORDS && isReasonComplete(cleaned)) {
    return appendPeriod(cleaned);
  }

  const semicolon = cleaned.indexOf(";");
  if (semicolon > 0) {
    const firstClause = cleaned.slice(0, semicolon).trim();
    if (
      wordCount(firstClause) <= max &&
      wordCount(firstClause) >= RECOMMENDATION_REASON_MIN_WORDS &&
      isReasonComplete(firstClause)
    ) {
      return appendPeriod(firstClause);
    }
  }

  if (wordCount(cleaned) <= max && isReasonComplete(cleaned)) {
    return appendPeriod(cleaned);
  }

  return null;
}

export function fitWordCount(text: string, max = RECOMMENDATION_REASON_MAX_WORDS) {
  return finalizeReason(text, max) ?? "";
}

export function sanitizeReason(reason: string, max = RECOMMENDATION_REASON_MAX_WORDS) {
  return finalizeReason(normalizeReasonVoice(reason), max) ?? "";
}

export function isGenericReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return true;
  if (isWeakReason(trimmed)) return true;
  return GENERIC_REASON_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isWeakReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return true;
  if (/\bthey(?:'ve|'re|'d|'ll)?\b/i.test(trimmed)) return true;
  if (/\btheir\b/i.test(trimmed)) return true;
  if (/\b(items|treats|dishes|food) like\b/i.test(trimmed)) return true;
  return false;
}

export function normalizeReasonVoice(reason: string) {
  return reason
    .replace(/\b[Tt]hey've\b/g, "you've")
    .replace(/\b[Tt]hey're\b/g, "you're")
    .replace(/\b[Tt]hey'd\b/g, "you'd")
    .replace(/\b[Tt]hey'll\b/g, "you'll")
    .replace(/\b[Tt]hey\b/g, "you")
    .replace(/\b[Tt]heir\b/g, "your")
    .replace(/\b[Tt]hem\b/g, "you");
}

const LABEL_STOP_WORDS = new Set(["with", "and", "the", "a", "an", "or", "of", "&", "in", "on"]);

function dishLabel(name: string, maxWords = 4) {
  const cleaned = name
    .replace(/[,;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let words = cleaned.split(" ").filter(Boolean).slice(0, maxWords);
  while (words.length > 1 && LABEL_STOP_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(" ") || cleaned.split(" ")[0] || "this dish";
}

function restaurantLabel(name: string) {
  const cleaned = name
    .replace(/[,;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 0) return "this spot";
  if (words.length === 1) return words[0];

  const first = words[0];
  if (first.toLowerCase() === "the" && words.length > 1) {
    return words.slice(0, 2).join(" ");
  }

  const twoWord = words.slice(0, 2).join(" ");
  if (twoWord.length <= 14 && !twoWord.includes("&")) {
    return twoWord;
  }

  return first;
}

function buildCompactReason(
  _dish: string,
  restaurant: string,
  theme: string,
  pickIndex: number,
  anchorDish?: string
) {
  const restShort = restaurantLabel(restaurant);
  const anchorShort = anchorDish ? dishLabel(anchorDish, 2) : null;

  const options = [
    `Fits the variety of plates on your profile.`,
    `A new spot that matches your overall taste.`,
    `Adds variety while staying close to what you post.`,
    `Another pick that stretches your lineup nicely.`,
    `Worth trying at ${restShort} for something different.`,
    `Complements the range of food you've shared.`,
    anchorShort ? `Echoes your ${anchorShort} order in a fresh way.` : null,
    theme ? `Connects to your ${theme} posts without repeating old spots.` : null,
  ].filter(Boolean) as string[];

  for (let offset = 0; offset < options.length; offset++) {
    const candidate = options[(pickIndex + offset) % options.length];
    const finalized = finalizeReason(candidate);
    if (finalized) return finalized;
  }

  return appendPeriod(`A solid new pick from ${restShort}.`);
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
  if (/eggslut|breakfast sandwich|egg sandwich|bacon egg/.test(text)) return "breakfast" as const;
  if (/salad|papaya salad|greens|slaw|cucumber/.test(text)) return "fresh" as const;
  if (/pancake|waffle|breakfast|eggs?|biscuit|brunch|oatmeal/.test(text)) return "breakfast" as const;
  if (/thai|pad thai|papaya|pho|ramen|bao|dumpling|wok|sushi|teriyaki|orange chicken|kung pao|fried rice|lo mein|chang/.test(text)) {
    return "asian" as const;
  }
  if (/donut|donuts|doughnut|cronut|cupcake|brownie|churro|muffin|pudding|dessert|cake|cookie|banana|pastry|pie|frosting|sundae|ice cream|cinnamon roll|cinnabon/.test(text)) {
    return "sweet" as const;
  }
  if (/pasta|spaghetti|fettuccine|gnocchi|rigatoni|penne|vodka|pesto|carbonara|bolognese|marinara|arrabbiata|alfredo|lasagna/.test(text)) {
    return "comfort" as const;
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
    (anchor, dish, rest) =>
      `You post breakfast like ${dishLabel(anchor)}; ${dishLabel(dish)} at ${restaurantLabel(rest)} is your kind of morning bite.`,
    (anchor, dish, rest) =>
      `Your ${dishLabel(anchor)} breakfast post makes ${dishLabel(dish)} at ${restaurantLabel(rest)} an easy yes.`,
  ],
  sweet: [
    (anchor, dish, rest) =>
      `You share sweets like ${dishLabel(anchor)}; ${dishLabel(dish)} at ${restaurantLabel(rest)} hits the same sugar craving.`,
    (anchor, dish, rest) =>
      `Your ${dishLabel(anchor)} post leaned sweet; ${dishLabel(dish)} at ${restaurantLabel(rest)} is another indulgent win.`,
  ],
  asian: [
    (anchor, dish, rest) =>
      `You order Asian plates like ${dishLabel(anchor)}; ${dishLabel(dish)} at ${restaurantLabel(rest)} keeps those bold flavors going.`,
    (anchor, dish, rest) =>
      `Your ${dishLabel(anchor)} post had big flavor; ${dishLabel(dish)} at ${restaurantLabel(rest)} should feel familiar.`,
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

  return "";
}

function themeForPick(history: PlateHistoryItem[], pickIndex: number) {
  const traits = dominantTraits(history, 3);
  if (traits.length > 0) {
    return traits[pickIndex % traits.length];
  }

  const profile = buildTasteProfile(history);
  const styles = [STYLE_WORDS[profile.primaryStyle], "varied", "mixed"];
  return styles[pickIndex % styles.length];
}

function profileThemeLabel(history: PlateHistoryItem[], pickIndex = 0) {
  return themeForPick(history, pickIndex);
}

export function getPickStyleKey(dish: string, restaurant: string) {
  return inferFoodStyle(dish, restaurant);
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
    const postedDessert = profile.recentPosts.some((post) =>
      isDessertLike(post.dish_name, post.restaurant_name)
    );
    if (!postedDessert) return false;
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

    const reason = finalizeReason(builder(anchorDish, dish, restaurant));
    if (
      !reason ||
      wordCount(reason) < RECOMMENDATION_REASON_MIN_WORDS ||
      isTooSimilar(reason, usedReasons) ||
      isGenericReason(reason)
    ) {
      continue;
    }
    usedReasons.add(reasonSignature(reason));
    return reason;
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
      `You often post chicken dishes; this pick stays in that lane.`,
      `Your chicken posts point toward a similar next order.`,
    ],
    beef: [
      `You post hearty beef plates; this order fits that style.`,
      `Your beef dishes suggest this as a sensible next try.`,
    ],
    seafood: [
      `Your seafood posts make this a sensible stretch.`,
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
  const theme = profileThemeLabel(history, pickIndex);

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
      if (styleReason) return styleReason;
    }

    if (sharedTrait) {
      const shared = reasonForTrait(
        sharedTrait,
        dish,
        restaurant,
        anchorDish,
        pickIndex,
        usedReasons
      );
      if (shared) return shared;
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
        if (bridge) return bridge;
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

    if (anchorStyle !== dishStyle && !anchorDessert && !dishDessert) {
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
    if (contrast) return contrast;
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
    if (styleReason) return styleReason;

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
    const finalized = finalizeReason(reason);
    if (
      !finalized ||
      wordCount(finalized) < RECOMMENDATION_REASON_MIN_WORDS ||
      isGenericReason(finalized) ||
      isTooSimilar(finalized, usedReasons)
    ) {
      continue;
    }
    usedReasons.add(reasonSignature(finalized));
    return finalized;
  }

  const fallback = buildCompactReason(
    dish,
    restaurant,
    theme,
    pickIndex,
    anchorPost ? anchorDish : undefined
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
  const cleaned = finalizeReason(normalizeReasonVoice(reason));
  const usedReasons = options?.usedReasons ?? new Set<string>();

  if (
    cleaned &&
    wordCount(cleaned) >= RECOMMENDATION_REASON_MIN_WORDS &&
    !isGenericReason(cleaned) &&
    !isTooSimilar(cleaned, usedReasons)
  ) {
    usedReasons.add(reasonSignature(cleaned));
    return cleaned;
  }

  return buildDishReason(dish, restaurant, history, locationLabel, options);
}

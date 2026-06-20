import { containsUsernameProfanity, PROFANITY_USERNAME_MESSAGE } from "@/lib/username-profanity";

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAME_MESSAGE = "This username is reserved";

const RESERVED_BRANDS = ["munchly", "platecheck"] as const;

const BRAND_AFFIXES = [
  "official",
  "real",
  "the",
  "team",
  "app",
  "hq",
  "admin",
  "support",
  "help",
  "verified",
  "staff",
  "mod",
  "mods",
  "fake",
  "not",
  "im",
  "its",
  "get",
  "my",
  "hi",
  "hey",
  "go",
  "use",
  "join",
];

export interface UsernameValidationOptions {
  /** Skip reserved checks when the user is keeping their current username. */
  existingUsername?: string | null;
  /** Allow the exact brand username (e.g. munchly) for existing accounts. */
  allowBrandUsername?: boolean;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

function leetDecode(value: string) {
  return value
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

function compactUsername(value: string) {
  return leetDecode(normalizeUsername(value).replace(/_/g, ""));
}

export function isExactBrandUsername(value: string) {
  const compact = compactUsername(value);
  return RESERVED_BRANDS.includes(compact as (typeof RESERVED_BRANDS)[number]);
}

function isReservedBrandVariation(compact: string, brand: string) {
  if (compact.startsWith(brand) && compact.length > brand.length) {
    return true;
  }

  if (compact.endsWith(brand) && compact.length > brand.length) {
    const prefix = compact.slice(0, -brand.length);
    if (/^\d+$/.test(prefix) || BRAND_AFFIXES.includes(prefix)) {
      return true;
    }
  }

  return false;
}

export function isReservedUsername(value: string) {
  const compact = compactUsername(value);
  if (!compact) return false;

  return RESERVED_BRANDS.some((brand) => isReservedBrandVariation(compact, brand));
}

export function isValidUsername(value: string, options?: UsernameValidationOptions) {
  return getUsernameError(value, options) === null;
}

export function getUsernameError(value: string, options?: UsernameValidationOptions) {
  const normalized = normalizeUsername(value);
  const existing = options?.existingUsername
    ? normalizeUsername(options.existingUsername)
    : null;

  if (!USERNAME_RE.test(normalized)) {
    return "Username must be 3-20 characters: letters, numbers, underscores";
  }

  if (existing && normalized === existing) {
    return null;
  }

  if (isReservedUsername(normalized)) {
    return RESERVED_USERNAME_MESSAGE;
  }

  if (containsUsernameProfanity(normalized)) {
    return PROFANITY_USERNAME_MESSAGE;
  }

  if (isExactBrandUsername(normalized) && !options?.allowBrandUsername) {
    return RESERVED_USERNAME_MESSAGE;
  }

  return null;
}

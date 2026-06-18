export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export const RESERVED_USERNAME_MESSAGE = "This username is reserved";

const RESERVED_BRAND = "platecheck";

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

export function isReservedUsername(value: string) {
  const compact = compactUsername(value);
  if (!compact) return false;

  if (compact === RESERVED_BRAND) return true;

  if (compact.startsWith(RESERVED_BRAND)) return true;

  if (compact.endsWith(RESERVED_BRAND) && compact.length > RESERVED_BRAND.length) {
    const prefix = compact.slice(0, -RESERVED_BRAND.length);
    if (/^\d+$/.test(prefix) || BRAND_AFFIXES.includes(prefix)) {
      return true;
    }
  }

  return false;
}

export function isValidUsername(value: string) {
  const normalized = normalizeUsername(value);
  return USERNAME_RE.test(normalized) && !isReservedUsername(normalized);
}

export function getUsernameError(value: string) {
  const normalized = normalizeUsername(value);

  if (!USERNAME_RE.test(normalized)) {
    return "Username must be 3-20 characters: letters, numbers, underscores";
  }

  if (isReservedUsername(normalized)) {
    return RESERVED_USERNAME_MESSAGE;
  }

  return null;
}

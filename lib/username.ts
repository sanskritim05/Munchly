export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function isValidUsername(value: string) {
  return USERNAME_RE.test(normalizeUsername(value));
}

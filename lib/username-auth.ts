import { normalizeUsername } from "@/lib/username";

const AUTH_EMAIL_DOMAIN = "users.platecheck.app";

export const PASSWORD_MIN_LENGTH = 6;

export function usernameAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

export function isValidPassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH;
}

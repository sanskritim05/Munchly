import { normalizeUsername } from "@/lib/username";

export const UNLIMITED_PLATE_USERNAME = "munchly";

export function hasUnlimitedPlates(username: string | null | undefined) {
  return normalizeUsername(username ?? "") === UNLIMITED_PLATE_USERNAME;
}

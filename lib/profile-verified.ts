import { UNLIMITED_PLATE_USERNAME } from "@/lib/plate-limits";
import { normalizeUsername } from "@/lib/username";

export const VERIFIED_PLATE_THRESHOLD = 50;

export function isOfficialAccountUsername(username: string | null | undefined) {
  return normalizeUsername(username ?? "") === UNLIMITED_PLATE_USERNAME;
}

export function isVerifiedProfile(profile: {
  username: string | null | undefined;
  total_plates?: number | null;
}) {
  if (isOfficialAccountUsername(profile.username)) return true;
  return (profile.total_plates ?? 0) >= VERIFIED_PLATE_THRESHOLD;
}

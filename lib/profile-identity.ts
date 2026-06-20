import { isOfficialAccountUsername } from "@/lib/profile-verified";

export const IDENTITY_CHANGE_COOLDOWN_DAYS = 15;

export function getNextIdentityChangeDate(changedAt: string | null) {
  if (!changedAt) return null;

  const next = new Date(changedAt);
  next.setDate(next.getDate() + IDENTITY_CHANGE_COOLDOWN_DAYS);
  return next;
}

export function canChangeIdentity(
  changedAt: string | null,
  username?: string | null,
  now = new Date()
) {
  if (isOfficialAccountUsername(username)) return true;

  const next = getNextIdentityChangeDate(changedAt);
  if (!next) return true;
  return now >= next;
}

export function formatIdentityUnlockDate(changedAt: string | null) {
  const next = getNextIdentityChangeDate(changedAt);
  if (!next) return null;

  return next.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function identityChangeError(
  field: "username" | "name",
  changedAt: string | null,
  username?: string | null
) {
  if (isOfficialAccountUsername(username)) return null;
  if (canChangeIdentity(changedAt, username)) return null;

  const unlockDate = formatIdentityUnlockDate(changedAt);
  if (!unlockDate) return null;

  if (field === "username") {
    return `You can change your username again on ${unlockDate}.`;
  }

  return `You can change your name again on ${unlockDate}.`;
}

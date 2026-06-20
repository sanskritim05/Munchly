export interface ProfileIdentity {
  username: string;
  display_name?: string | null;
}

export function profileHandle(username: string) {
  return `@${username}`;
}

export function profileDisplayName(profile: ProfileIdentity | null | undefined) {
  return profile?.display_name?.trim() || null;
}

export function profilePrimaryLabel(profile: ProfileIdentity) {
  return profileDisplayName(profile) ?? profileHandle(profile.username);
}

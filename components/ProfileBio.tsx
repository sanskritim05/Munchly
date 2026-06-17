export function ProfileBio({ bio }: { bio: string | null }) {
  if (!bio) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <p className="text-gray-300">{bio}</p>
    </div>
  );
}

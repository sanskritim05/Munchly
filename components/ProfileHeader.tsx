import Image from "next/image";
import { AppIcon } from "@/components/AppIcon";
import { TierBadge } from "@/components/TierBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export function ProfileHeader({
  displayName,
  username,
  avatarUrl,
  bio,
  averageScore,
  totalPlates,
  verified = false,
}: {
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  averageScore: number;
  totalPlates: number;
  verified?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <AppIcon kind="profile" size={56} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="inline-flex min-w-0 items-center gap-1 text-xl font-bold sm:text-2xl">
          <span className="truncate">{displayName?.trim() || `@${username}`}</span>
          {verified ? <VerifiedBadge size={18} /> : null}
        </p>
        {displayName?.trim() ? (
          <p className="mt-0.5 truncate text-sm text-gray-400">@{username}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <TierBadge
            averageScore={averageScore}
            totalPlates={totalPlates}
            username={username}
          />
          {bio ? (
            <>
              <span className="text-gray-500" aria-hidden>
                ⋅
              </span>
              <p className="text-sm text-gray-300">{bio}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { ScoreBadge } from "@/components/ScoreBadge";

import { UserLabel } from "@/components/UserLabel";

export function FeedPlateOverlay({
  score,
  username,
  displayName,
  verified = false,
  title,
  subtitle,
  isFollowing = false,
  className = "",
}: {
  score: number;
  username: string;
  displayName?: string | null;
  verified?: boolean;
  title: string;
  subtitle?: string | null;
  isFollowing?: boolean;
  className?: string;
}) {
  return (
    <div className={`on-media pointer-events-none absolute bottom-0 left-0 right-0 p-4 sm:p-5 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ScoreBadge score={score} size="sm" />
        <span className="text-sm">
          <UserLabel
            username={username}
            displayName={displayName}
            verified={verified}
            nameClassName="font-medium text-white"
            handleClassName="text-white/80"
          />
          {isFollowing ? (
            <>
              <span className="text-white"> · </span>
              <span className="text-white">following</span>
            </>
          ) : null}
        </span>
      </div>
      <p className="text-lg font-bold leading-tight sm:text-xl">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
    </div>
  );
}

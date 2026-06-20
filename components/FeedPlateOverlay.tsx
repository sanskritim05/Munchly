import { ScoreBadge } from "@/components/ScoreBadge";

export function FeedPlateOverlay({
  score,
  username,
  title,
  subtitle,
  isFollowing = false,
  className = "",
}: {
  score: number;
  username: string;
  title: string;
  subtitle?: string | null;
  isFollowing?: boolean;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute bottom-0 left-0 right-0 p-4 sm:p-5 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ScoreBadge score={score} size="sm" />
        <span className="text-sm text-gray-300">
          @{username}
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

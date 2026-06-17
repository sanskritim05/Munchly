import { ScoreBadge } from "@/components/ScoreBadge";

export function FeedPlateOverlay({
  score,
  username,
  title,
  subtitle,
  className = "",
}: {
  score: number;
  username: string;
  title: string;
  subtitle?: string | null;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute bottom-0 left-0 right-0 p-5 ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <ScoreBadge score={score} size="sm" />
        <span className="text-sm text-gray-300">@{username}</span>
      </div>
      <p className="text-xl font-bold leading-tight">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
    </div>
  );
}

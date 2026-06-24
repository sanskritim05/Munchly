import { AppIcon } from "@/components/AppIcon";

export function RateStreakBadge({
  ratedToday,
  streak,
}: {
  ratedToday: number;
  streak: number;
}) {
  return (
    <div className="shrink-0 text-xs whitespace-nowrap">
      <span className="inline-flex items-center gap-2">
        <AppIcon kind="flame" size={14} />
        <span>{ratedToday} rated today</span>
        <span className="text-gray-600" aria-hidden>
          ·
        </span>
        <span className="text-gray-500">
          {streak > 0 ? `Day ${streak} streak` : "No streak"}
        </span>
      </span>
    </div>
  );
}

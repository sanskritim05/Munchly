import { AppIcon } from "@/components/AppIcon";

export function RateStreakBadge({
  ratedToday,
  streak,
}: {
  ratedToday: number;
  streak: number;
}) {
  return (
    <div className="shrink-0 rounded-full bg-black/60 px-3 py-1 text-xs whitespace-nowrap sm:text-sm">
      <span className="inline-flex items-center gap-1.5">
        <AppIcon kind="flame" size={16} />
        <span>{ratedToday} rated today</span>
        <span className="text-gray-400">·</span>
        <span>{streak > 0 ? `Day ${streak} streak` : "No streak"}</span>
      </span>
    </div>
  );
}

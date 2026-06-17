import { getPlateTier } from "@/lib/tiers";

export function TierBadge({
  averageScore,
  totalPlates,
}: {
  averageScore: number;
  totalPlates: number;
}) {
  const tier = getPlateTier(averageScore, totalPlates);

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-hot/40 bg-surface px-2.5 py-0.5 text-xs font-semibold text-hot">
      {tier.name}
    </span>
  );
}

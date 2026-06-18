import Image from "next/image";
import { AppIcon } from "@/components/AppIcon";
import { shareScoreColor } from "@/lib/share-card";

export function SharePlateCard({
  imageUrl,
  score,
  dishName,
  username,
  tierLabel,
  hotCount,
  notCount,
}: {
  imageUrl: string;
  score: number;
  dishName: string;
  username: string;
  tierLabel: string;
  hotCount: number;
  notCount: number;
}) {
  const scoreColor = shareScoreColor(score);
  const totalVotes = hotCount + notCount;
  const hotPct = totalVotes > 0 ? Math.round((hotCount / totalVotes) * 100) : 0;
  const notPct = totalVotes > 0 ? 100 - hotPct : 0;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#222] bg-[#0a0a0a]">
      <div className="relative aspect-[5/4] w-full">
        <Image
          src={imageUrl}
          alt={dishName}
          fill
          className="object-cover object-center"
          unoptimized
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <span
            className="font-syne text-7xl font-extrabold leading-none tabular-nums sm:text-8xl"
            style={{ color: scoreColor }}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <p className="truncate text-lg text-[#f0ede6]">{dishName}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="inline-flex items-center gap-1" style={{ color: "#ff3c00" }}>
              <AppIcon kind="flame" size={14} />
              {hotPct}% hot
            </span>
            <span className="inline-flex items-center gap-1" style={{ color: "#6b7280" }}>
              {notPct}% not
              <AppIcon kind="not" size={14} />
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-sm bg-[#222]">
            <div className="h-full rounded-sm bg-[#ff3c00]" style={{ width: `${hotPct}%` }} />
          </div>
          <p className="mt-1.5 text-center text-[11px] text-[#444]">
            {totalVotes} vote{totalVotes === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#222] pt-4">
          <span className="truncate text-sm font-semibold text-[#f0ede6]">@{username}</span>
          <span
            className="shrink-0 rounded-full border border-[#333] bg-[#151515] px-2.5 py-1 text-[11px] font-semibold text-[#c9c4bc]"
          >
            {tierLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

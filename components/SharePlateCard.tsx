import Image from "next/image";
import { AppIcon } from "@/components/AppIcon";
import { getShareTierLabel, shareScoreColor } from "@/lib/share-card";

export function SharePlateCard({
  imageUrl,
  score,
  dishName,
  username,
  hotCount,
  notCount,
}: {
  imageUrl: string;
  score: number;
  dishName: string;
  username: string;
  hotCount: number;
  notCount: number;
}) {
  const scoreColor = shareScoreColor(score);
  const tierLabel = getShareTierLabel(score);
  const totalVotes = hotCount + notCount;
  const hotPct = totalVotes > 0 ? Math.round((hotCount / totalVotes) * 100) : 0;
  const notPct = totalVotes > 0 ? 100 - hotPct : 0;

  return (
    <div className="w-full">
      <div className="relative h-[260px] w-full overflow-hidden rounded-2xl">
        <Image
          src={imageUrl}
          alt={dishName}
          fill
          className="object-cover object-center"
          unoptimized
          priority
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
          style={{ background: "linear-gradient(to top, #080808 0%, transparent 100%)" }}
        />
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <span
            className="font-syne text-[80px] font-extrabold leading-none tabular-nums"
            style={{
              color: scoreColor,
              boxShadow: `0 0 40px ${scoreColor}22`,
            }}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      <p className="mt-5 truncate text-lg text-[#f0ede6]">{dishName}</p>

      <div className="mt-5">
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

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-[#888]">
          @{username} · platecheck.app
        </span>
        <span
          className="shrink-0 rounded-full bg-[#1a1a1a] px-2.5 py-1 text-[11px] text-[#888]"
          style={{ border: "0.5px solid #2a2a2a" }}
        >
          {tierLabel}
        </span>
      </div>
    </div>
  );
}

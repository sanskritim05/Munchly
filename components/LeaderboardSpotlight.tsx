import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { ScoreBadge } from "@/components/ScoreBadge";
import { UserLabel } from "@/components/UserLabel";
import type { LeaderboardEntry } from "@/lib/leaderboard";

function plateTitle(entry: LeaderboardEntry) {
  return entry.restaurantName ?? entry.dishName ?? "Plate";
}

function plateSubtitle(entry: LeaderboardEntry) {
  if (entry.restaurantName && entry.dishName) return entry.dishName;
  return null;
}

export function LeaderboardSpotlight({
  label,
  entry,
}: {
  label: string;
  entry: LeaderboardEntry | null;
}) {
  if (!entry) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <AppIcon kind="flame" size={28} />
        <p className="mt-3 font-bold text-gray-200">{label}</p>
        <p className="mt-1 text-sm text-gray-500">No plate yet. Post one and get rated.</p>
      </div>
    );
  }

  const subtitle = plateSubtitle(entry);

  return (
    <Link
      href={`/plate/${entry.plateId}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-hot/50"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
        {entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gray-500">
            <AppIcon kind="flame" size={40} />
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-hot px-2.5 py-1 text-xs font-bold text-white">
          {label}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="truncate text-lg font-bold text-white">{plateTitle(entry)}</p>
          {subtitle ? <p className="truncate text-sm text-gray-300">{subtitle}</p> : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            <UserLabel
              username={entry.username}
              displayName={entry.displayName}
              verified={entry.verified}
              className="min-w-0 truncate text-sm"
              nameClassName="font-medium text-white"
              handleClassName="text-white/75"
            />
            <ScoreBadge score={entry.score} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LeaderboardPlateRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <Link
      href={`/plate/${entry.plateId}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-hot/50"
    >
      <span className="w-8 text-center text-xl font-bold text-hot">#{entry.rank}</span>
      <div className="relative h-14 w-14 overflow-hidden rounded-xl">
        {entry.imageUrl ? (
          <Image src={entry.imageUrl} alt="" fill className="object-cover" unoptimized />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        {entry.restaurantName ? (
          <p className="truncate font-bold leading-snug">{entry.restaurantName}</p>
        ) : null}
        {entry.dishName ? (
          <p
            className={`truncate text-sm leading-snug text-gray-300 ${
              entry.restaurantName ? "" : "font-bold text-white"
            }`}
          >
            {entry.dishName}
          </p>
        ) : null}
        {!entry.restaurantName && !entry.dishName ? <p className="font-bold">Plate</p> : null}
        <div className="mt-1">
          <UserLabel
            username={entry.username}
            displayName={entry.displayName}
            verified={entry.verified}
            className="truncate text-sm"
            nameClassName="font-medium text-gray-200"
            handleClassName="text-gray-400"
          />
        </div>
      </div>
      <ScoreBadge score={entry.score} size="sm" />
    </Link>
  );
}

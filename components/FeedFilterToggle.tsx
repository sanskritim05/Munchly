import Link from "next/link";
import type { FeedFilter } from "@/lib/feed-scope";

export function FeedFilterToggle({
  filter,
  onChange,
  followingCount,
  hint,
}: {
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
  followingCount: number;
  hint?: string;
}) {
  if (followingCount === 0) {
    return (
      <p className="text-xs text-gray-500">
        <Link href="/leaderboard" className="font-medium text-hot hover:underline">
          Follow people on Top
        </Link>{" "}
        to see their plates first
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {hint ? <span className="text-gray-500">{hint}</span> : null}
      <button
        type="button"
        onClick={() => onChange("everyone")}
        className={filter === "everyone" ? "font-semibold text-white" : "text-gray-500 hover:text-gray-300"}
      >
        All
      </button>
      <span className="text-gray-600" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={() => onChange("following")}
        className={
          filter === "following" ? "font-semibold text-white" : "text-gray-500 hover:text-gray-300"
        }
      >
        Following
      </button>
    </div>
  );
}

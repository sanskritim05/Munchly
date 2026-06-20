import Link from "next/link";
import type { FeedFilter } from "@/lib/feed-scope";

export function FeedFilterToggle({
  filter,
  onChange,
  followingCount,
}: {
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
  followingCount: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs">
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
    </div>
  );
}

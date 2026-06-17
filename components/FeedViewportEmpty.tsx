import { FEED_VIEWPORT_HEIGHT } from "@/lib/feed-scope";

export function FeedViewportEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center px-4"
      style={{ height: FEED_VIEWPORT_HEIGHT }}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">{children}</div>
    </div>
  );
}

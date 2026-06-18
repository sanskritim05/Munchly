import { feedEmptyBodyClass, feedEmptyTitleClass } from "@/lib/feed-ui";

export function FeedViewportEmpty({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center px-page">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        {title ? <p className={feedEmptyTitleClass}>{title}</p> : null}
        {description ? <p className={feedEmptyBodyClass}>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}

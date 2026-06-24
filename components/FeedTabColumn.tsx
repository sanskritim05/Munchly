import { PeopleSearchButton } from "@/components/PeopleSearchOverlay";

export function FeedTabColumn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-h-0 w-full gap-3 ${className}`}>
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
      <div className="pointer-events-none shrink-0 opacity-0" aria-hidden>
        <PeopleSearchButton onClick={() => {}} />
      </div>
    </div>
  );
}

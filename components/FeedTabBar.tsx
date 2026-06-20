import type { FeedTab } from "@/lib/feed-scope";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "rate", label: "Rate" },
  { id: "explore", label: "Explore" },
];

export function FeedTabBar({
  tab,
  onChange,
}: {
  tab: FeedTab;
  onChange: (tab: FeedTab) => void;
}) {
  return (
    <div
      className="flex rounded-full border border-[#222] bg-[#111] p-1"
      style={{ borderWidth: "0.5px" }}
    >
      {TABS.map(({ id, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex-1 rounded-full py-2 text-center text-sm sm:py-2.5 ${
              active ? "bg-[#ff3c00] font-bold text-white" : "bg-transparent font-normal text-[#555]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

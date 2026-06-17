"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getPlateTier } from "@/lib/tiers";

export function TierBadge({
  averageScore,
  totalPlates,
}: {
  averageScore: number;
  totalPlates: number;
}) {
  const tier = getPlateTier(averageScore, totalPlates);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-describedby={open ? descriptionId : undefined}
        className="inline-flex shrink-0 items-center rounded-full border border-hot/40 bg-surface px-2.5 py-0.5 text-xs font-semibold text-hot transition-colors hover:bg-hot/10"
      >
        {tier.name}
      </button>

      {open ? (
        <div
          id={descriptionId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-surface px-3 py-2 text-left shadow-lg"
        >
          <p className="text-xs font-semibold text-hot">{tier.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">{tier.description}</p>
        </div>
      ) : null}
    </div>
  );
}

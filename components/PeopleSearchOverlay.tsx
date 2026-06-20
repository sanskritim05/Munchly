"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppIcon } from "@/components/AppIcon";
import { PeopleSearchPanel } from "@/components/PeopleSearchPanel";

export function PeopleSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-page pt-4 sm:pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="app-container max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border border-border bg-[var(--bg)] p-4 shadow-2xl sm:p-5"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Search people</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-hot/40 hover:text-hot"
              >
                Close
              </button>
            </div>
            <PeopleSearchPanel autoFocus onResultClick={onClose} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PeopleSearchButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search people"
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-opacity hover:opacity-80 ${className}`}
    >
      <AppIcon kind="search" size={22} />
    </button>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppIcon } from "@/components/AppIcon";

export function RateIntroOverlay({
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="app-container w-full rounded-2xl border border-border bg-[var(--bg)] p-5 shadow-2xl sm:p-6"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold">How to rate plates</h2>
            <p className="mt-2 text-sm text-gray-400">
              Swipe or tap to vote hot or not on each plate. You&apos;ll only see this once.
            </p>

            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hot/50 bg-surface">
                  <AppIcon kind="flame" size={22} />
                </span>
                <div>
                  <p className="font-semibold text-hot">Hot</p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    Swipe right or tap the flame if you&apos;d eat it.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                  <AppIcon kind="not" size={22} />
                </span>
                <div>
                  <p className="font-semibold">Not</p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    Swipe left or tap the campfire if you&apos;d pass.
                  </p>
                </div>
              </li>
            </ul>

            <p className="mt-5 text-sm text-gray-400">
              Rate 5 plates a day to keep your streak going.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-hot py-3 text-sm font-bold"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

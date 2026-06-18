"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppLogo } from "@/components/AppLogo";
import { markPostPromptSeen } from "@/lib/first-plate-prompt";

const cards = [
  { rotate: -8, x: -12, y: 0, delay: 0 },
  { rotate: 4, x: 8, y: 12, delay: 0.08 },
  { rotate: -3, x: 0, y: 24, delay: 0.16 },
];

export function FirstPlatePrompt() {
  function dismiss() {
    markPostPromptSeen();
  }

  return (
    <div className="flex min-h-app flex-col items-center justify-center bg-[#080808] px-6 py-10 text-center">
      <AppLogo size={120} className="mb-8" />
      <div className="relative mb-10 h-40 w-full max-w-xs">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: card.y, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: card.delay }}
            className="absolute left-1/2 top-0 h-28 w-44 -translate-x-1/2 rounded-2xl border border-[#222] bg-gradient-to-br from-[#1a1a1a] to-[#111]"
            style={{ rotate: `${card.rotate}deg`, marginLeft: card.x }}
          />
        ))}
      </div>

      <h1 className="font-syne text-[32px] font-extrabold leading-tight text-[#f0ede6]">
        now let&apos;s see what you&apos;ve got
      </h1>
      <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-[#666]">
        post your first plate and find out if the internet thinks it&apos;s a 10
      </p>

      <Link
        href="/post"
        onClick={dismiss}
        className="mt-10 flex w-full max-w-sm items-center justify-center rounded-full bg-[#ff3c00] px-6 py-4 font-syne text-base font-bold text-white"
      >
        post my first plate →
      </Link>

      <Link
        href="/swipe"
        onClick={dismiss}
        className="mt-4 text-[13px] text-[#444] hover:text-[#666]"
      >
        explore the feed first
      </Link>
    </div>
  );
}

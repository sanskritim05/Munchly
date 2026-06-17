"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-hot/40 via-purple/20 to-black" />
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold tracking-tight">Is your food a 10?</h1>
          <p className="mt-4 text-xl text-gray-400">Post it. Rate it. Go viral.</p>
          <Link
            href="/swipe"
            className="mt-8 inline-block rounded-full bg-hot px-6 py-2.5 text-base font-bold shadow-md shadow-hot/30 transition-transform hover:scale-105"
          >
            Rate a Plate
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            <Link href="/get-started" className="text-hot hover:underline">
              Get started
            </Link>{" "}
            to post your own
          </p>
        </div>
      </div>
    </div>
  );
}

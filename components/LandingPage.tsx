"use client";

import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { LandingCarouselBackdrop } from "@/components/LandingCarouselBackdrop";
import type { LandingCarouselPlate } from "@/lib/landing-carousel";

export function LandingPage({ plates }: { plates: LandingCarouselPlate[] }) {
  return (
    <LandingCarouselBackdrop initialPlates={plates}>
      <AppLogo size={180} priority className="mx-auto sm:hidden" />
      <AppLogo size={220} priority className="mx-auto hidden sm:block" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Is your food a 10?</h1>
      <p className="mt-4 text-lg text-gray-400 sm:text-xl">Post it. Rate it. Find out.</p>
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
    </LandingCarouselBackdrop>
  );
}

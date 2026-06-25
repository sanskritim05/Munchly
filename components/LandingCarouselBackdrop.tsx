"use client";

import { LandingPlateCarousel } from "@/components/LandingPlateCarousel";
import type { LandingCarouselPlate } from "@/lib/landing-carousel";

export function LandingCarouselBackdrop({
  children,
  initialPlates,
  contentClassName = "w-full max-w-md",
}: {
  children: React.ReactNode;
  initialPlates: LandingCarouselPlate[];
  contentClassName?: string;
}) {
  return (
    <div className="min-h-app">
      <div className="relative flex min-h-app flex-col items-center justify-center overflow-hidden px-page text-center">
        <LandingPlateCarousel initialPlates={initialPlates} />
        <div className="pointer-events-none absolute inset-0 bg-black/75" />

        <div className={`relative z-10 ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}

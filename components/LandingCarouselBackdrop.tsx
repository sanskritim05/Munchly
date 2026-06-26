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
    <div className="relative min-h-app w-full">
      <LandingPlateCarousel initialPlates={initialPlates} />
      <div className="pointer-events-none fixed inset-0 bg-black/75" />

      <div className="relative z-10 flex min-h-app flex-col items-center justify-start px-page py-safe text-center sm:justify-center">
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}

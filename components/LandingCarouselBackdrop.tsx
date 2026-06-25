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
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <LandingPlateCarousel initialPlates={initialPlates} />
      <div className="pointer-events-none fixed inset-0 bg-black/75" />

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-page py-safe text-center">
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}

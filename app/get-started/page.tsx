import { Suspense } from "react";
import { GetStartedContent } from "@/components/GetStartedContent";
import { fetchLandingCarouselPlates } from "@/lib/landing-carousel";

export default async function GetStartedPage() {
  const plates = await fetchLandingCarouselPlates();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-app items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <GetStartedContent plates={plates} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { UsernameSignInForm } from "@/components/UsernameSignInForm";
import { fetchLandingCarouselPlates } from "@/lib/landing-carousel";

export default async function SignInPage() {
  const plates = await fetchLandingCarouselPlates();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-app items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <UsernameSignInForm plates={plates} />
    </Suspense>
  );
}

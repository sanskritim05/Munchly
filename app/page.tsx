import { LandingPage } from "@/components/LandingPage";
import { fetchLandingCarouselPlates } from "@/lib/landing-carousel";

export default async function HomePage() {
  const plates = await fetchLandingCarouselPlates();

  return <LandingPage plates={plates} />;
}

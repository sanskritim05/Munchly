import { TastePicks } from "@/components/TastePicks";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export default function PicksPage() {
  return (
    <RequireOnboarding>
      <TastePicks />
    </RequireOnboarding>
  );
}

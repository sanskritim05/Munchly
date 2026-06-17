import { PostPlateForm } from "@/components/PostPlateForm";
import { PostGate } from "@/components/PostGate";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export default function PostPage() {
  return (
    <RequireOnboarding>
      <PostGate>
        <PostPlateForm />
      </PostGate>
    </RequireOnboarding>
  );
}

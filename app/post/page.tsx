import { PostPlateForm } from "@/components/PostPlateForm";
import { RequireOnboarding } from "@/components/RequireOnboarding";

export default function PostPage() {
  return (
    <RequireOnboarding>
      <PostPlateForm />
    </RequireOnboarding>
  );
}

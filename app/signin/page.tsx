import { Suspense } from "react";
import { UsernameSignInForm } from "@/components/UsernameSignInForm";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-app items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <UsernameSignInForm />
    </Suspense>
  );
}

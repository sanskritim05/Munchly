import Link from "next/link";
import { FeedViewportEmpty } from "@/components/FeedViewportEmpty";

export function FeedSignInPrompt({
  title = "Create an account to rate",
  description = "Browse posts for free. Sign up to swipe hot or not and join the community.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <FeedViewportEmpty title={title} description={description}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/get-started?next=/swipe"
          className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
        >
          Get started
        </Link>
        <Link
          href="/signin?next=/swipe"
          className="inline-flex min-w-[10.5rem] items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-bold"
        >
          Sign in
        </Link>
      </div>
    </FeedViewportEmpty>
  );
}
